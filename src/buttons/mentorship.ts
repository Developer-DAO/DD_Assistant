import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ComponentType,
	EmbedBuilder,
	GuildMember,
	InteractionReplyOptions,
	ModalBuilder,
	StringSelectMenuBuilder,
	TextChannel,
	TextInputBuilder,
	TextInputStyle,
	userMention
} from 'discord.js';
import { isFinite } from 'lodash';
import { errAsync, okAsync, ResultAsync } from 'neverthrow';
import { sprintf } from 'sprintf-js';

import { prisma } from '../prisma/prisma';
import { Button } from '../structures/Button';
import { myCache } from '../structures/Cache';
import { ButtonCollectorCustomId, ButtonCustomIdEnum } from '../types/Button';
import { FailSendDmError, MentorshipNotFoundError, MongoDbError } from '../types/Error';
import { ModalCollectorCustomIdEnum } from '../types/Modal';
import { COMMAND_CONTENT, NUMBER } from '../utils/const';
import dayjs from '../utils/dayjs';
import { isEpochEnd, separateArray } from '../utils/util';

export default new Button({
	customIds: [
		ButtonCustomIdEnum.ClaimMentorEffort,
		ButtonCustomIdEnum.ConfirmMentorEffort,
		ButtonCustomIdEnum.MentorDataShare,
		ButtonCustomIdEnum.LeaderboardStatistics
	],
	execute: async ({ interaction }) => {
		const { member, customId, guildId } = interaction;
		const { id: memberId } = member;

		if (isEpochEnd()) {
			return interaction.reply({
				content: 'Sorry, mentorship does not start.',
				ephemeral: true
			});
		}
		await interaction.deferReply({ ephemeral: true });

		if (customId === ButtonCustomIdEnum.ClaimMentorEffort) {
			const result = await ResultAsync.fromPromise(
				prisma.mentor.findFirst({
					cursor: {
						id: memberId
					}
				}),
				(err: Error) => err
			).andThen((mentor) => {
				if (!mentor) {
					return errAsync(new Error('Sorry, you are not registered in the database.'));
				} else {
					if (mentor.menteesRef.length === 0) {
						return errAsync(new Error('Sorry, you do not have any mentees.'));
					}
					return okAsync(mentor);
				}
			});

			if (result.isErr()) {
				return interaction.followUp({
					content: result.error.message
				});
			}
			const intervalInSec = 3 * 60;
			const msg = await interaction.followUp({
				content: getClaimEffortConent(intervalInSec),
				components: [
					new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
						new StringSelectMenuBuilder()
							.setCustomId('claim_hrs')
							.setPlaceholder('Please choose your mentee')
							.addOptions(
								...result.value.menteesRef.map((menteeId) => ({
									label:
										interaction.guild.members.cache.get(menteeId)
											?.displayName ?? `Unknown user - ${menteeId}`,
									value: menteeId
								}))
							)
					)
				],
				fetchReply: true
			});
			const collector = msg.createMessageComponentCollector({
				time: intervalInSec * 1000,
				componentType: ComponentType.StringSelect
			});

			collector.on('collect', async (selectInteraction) => {
				const [menteeId] = selectInteraction.values;
				const currentEpoch = myCache.myGet('CurrentEpoch')[guildId];

				collector.resetTimer();
				await interaction.editReply({
					content: getClaimEffortConent(intervalInSec)
				});
				selectInteraction.showModal(getClaimEfforModal());
				const result = await ResultAsync.fromPromise(
					selectInteraction.awaitModalSubmit({
						time: 1 * 60 * 1000
					}),
					(err: Error) => err
				);

				if (result.isErr()) {
					interaction.editReply({
						content:
							'Sorry, error occurred when receiving your working mins. Please try again.'
					});
					return;
				}
				const mins = Number(result.value.fields.getTextInputValue('claim_mins'));

				// todo Check if the input is smaller than 0
				if (!isFinite(mins)) {
					result.value.reply({
						content: 'Sorry, please input integer only.',
						ephemeral: true
					});
					return;
				}
				await result.value.deferReply({ ephemeral: true });
				const updateResult = await ResultAsync.fromPromise(
					prisma.reward.findFirst({
						where: {
							epochId: currentEpoch.id,
							mentorId: memberId,
							menteeId
						}
					}),
					(err: Error) => err
				).andThen((reward) => {
					if (reward) {
						if (reward.isConfirmed) {
							return errAsync(
								new Error(
									`Sorry, <@${menteeId}> has confirmed this effort. You cannot reclaim it.`
								)
							);
						}
						return ResultAsync.fromPromise(
							prisma.reward.update({
								where: {
									id: reward.id
								},
								data: {
									claimedMins: mins
								}
							}),
							(err: Error) => err
						);
					}
					return ResultAsync.fromPromise(
						prisma.reward.create({
							data: {
								claimedMins: mins,
								isConfirmed: false,
								menteeId,
								mentorId: memberId,
								discordId: guildId,
								epochId: currentEpoch.id
							}
						}),
						(err: Error) => err
					);
				});

				if (updateResult.isErr()) {
					result.value.followUp({
						content: updateResult.error.message
					});
					return;
				}
				result.value.followUp({
					content: `Successfully claimed ${mins} mins for <@${menteeId}>. Please inform your mentee to confirm your efforts!`
				});
			});
			collector.on('end', (collected) => {
				if (collected.size === 0) {
					interaction.editReply({
						content:
							'Sorry, you did not claim your effort in time. Please click the button again.',
						components: []
					});
				}
			});
			return;
		}
		if (customId === ButtonCustomIdEnum.ConfirmMentorEffort) {
			const rewardResult = await ResultAsync.fromPromise(
				prisma.mentee.findFirst({
					where: {
						id: memberId
					}
				}),
				() => new Error('Sorry, error occurred when querying the database.')
			).andThen((mentee) => {
				if (!mentee) {
					return errAsync(new Error('Sorry, you are not registered in the database.'));
				}
				return ResultAsync.fromPromise(
					prisma.reward.findMany({
						where: {
							menteeId: memberId,
							mentorId: mentee.mentorId,
							isConfirmed: false
						}
					}),
					() => new Error('Sorry, error occurred when querying the database.')
				);
			});

			if (rewardResult.isErr()) {
				return interaction.followUp({
					content: rewardResult.error.message
				});
			}

			if (rewardResult.value.length === 0) {
				return interaction.followUp({
					content: 'Currently, you do not have any unconfirmed effort.'
				});
			}
			const rewards = rewardResult.value.sort(
				(a, b) => Number(b.epochId) - Number(a.epochId)
			);
			const epochResult = await ResultAsync.fromPromise(
				prisma.epoch.findMany({
					where: {
						id: {
							in: rewards.map((reward) => reward.epochId)
						}
					},
					orderBy: {
						id: 'desc'
					}
				}),
				() => new Error('Sorry, error occurred when querying the database.')
			);

			if (epochResult.isErr()) {
				return interaction.followUp({
					content: epochResult.error.message
				});
			}
			const embedArray = rewards.map((reward, index) =>
				new EmbedBuilder()
					.setTitle('Effort Confirm Card')
					.setDescription(
						sprintf(COMMAND_CONTENT.MENTORSHIP_PLAYGROUND_CONTENT_TEMPLATE, {
							startTimestamp: epochResult.value[index].startTimestamp,
							endTimestamp: epochResult.value[index].endTimestamp,
							mentorId: reward.mentorId,
							claimedMins: reward.claimedMins
						})
					)
					.setFooter({ text: epochResult.value[index].id })
			);
			const intervalInSec = 1 * 60;

			let page = 0;
			const confirmedPage: number[] = [];
			const pageLength = embedArray.length;
			const replyMsg = await interaction.followUp(
				getConfirmEffortReply(intervalInSec, embedArray[page], page, pageLength, false)
			);
			const collector = replyMsg.createMessageComponentCollector({
				time: intervalInSec * 1000,
				componentType: ComponentType.Button
			});

			collector.on('collect', async (btnInteraction) => {
				// Reason move this branch to the top
				// You cannot deferUpdate or deferReply when you wanna showModal
				if (btnInteraction.customId === ButtonCollectorCustomId.ConfirmEffortMessage) {
					const modal = new ModalBuilder()
						.setCustomId(ModalCollectorCustomIdEnum.SendMessageToMentor)
						.setTitle(`Leave message to mentor`)
						.addComponents(
							new ActionRowBuilder<TextInputBuilder>().addComponents(
								new TextInputBuilder()
									.setCustomId('message')
									.setLabel('Input a message to your mentor or leave blank')
									.setStyle(TextInputStyle.Short)
							)
						);

					await btnInteraction.showModal(modal);
					const result = await ResultAsync.fromPromise(
						btnInteraction.awaitModalSubmit({
							time: 1 * 60 * 1000
						}),
						(err: Error) => err
					);

					if (result.isErr()) {
						interaction.editReply({
							content:
								'Sorry, error occurred when receiving your message. Please try again.'
						});
						return;
					}
					const message = result.value.fields.getTextInputValue('message');

					await result.value.deferReply({ ephemeral: true });
					const dmSendResult = await dmUser(
						btnInteraction.guild.members.cache.get(rewards[page].mentorId),
						`Your mentee <@${
							rewards[page].menteeId
						}> refused your claimed working efforts${
							message ? ` and left a message for you:\n${message}` : '.'
						}`
					);

					if (dmSendResult.isErr()) {
						await result.value.followUp({
							content: dmSendResult.error.message,
							ephemeral: true
						});
						await logClosedDM(
							btnInteraction.guild.channels.cache.get(
								myCache.myGet('MentorshipConfig')[guildId].notificationChannel
							) as TextChannel,
							rewards[page].menteeId,
							rewards[page].mentorId
						);
						return;
					}
					await result.value.followUp({
						content: `Successfully sent a DM to <@${rewards[page].mentorId}>!`,
						ephemeral: true
					});
				} else {
					await btnInteraction.deferUpdate();
					switch (btnInteraction.customId) {
						case ButtonCollectorCustomId.Next:
							page++;
							break;
						case ButtonCollectorCustomId.Previous:
							page--;
							break;
						case ButtonCollectorCustomId.First:
							page = 0;
							break;
						case ButtonCollectorCustomId.Last:
							page = embedArray.length - 1;
							break;
						case ButtonCollectorCustomId.ConfirmEffortYes: {
							const confirmResult = await ResultAsync.fromPromise(
								prisma.reward.update({
									where: {
										id: rewards[page].id
									},
									data: {
										isConfirmed: true
									}
								}),
								() => new MongoDbError()
							);

							if (confirmResult.isErr()) {
								btnInteraction.followUp({
									content: confirmResult.error.message,
									ephemeral: true
								});
							} else {
								confirmedPage.push(page);
								embedArray[page].setTitle('[Confirmed] Effort Confirm Card');
								await btnInteraction.followUp({
									content: 'Successfully confirmed your effort!',
									ephemeral: true
								});
								await dmUser(
									btnInteraction.guild.members.cache.get(rewards[page].id),
									`Your mentee <@${rewards[page].menteeId}> has confirmed your effort! You have earned \`${rewards[page].claimedMins}\` minutes!`
								);
								collector.resetTimer();
							}
						}
					}
				}

				await interaction.editReply(
					getConfirmEffortReply(
						intervalInSec,
						embedArray[page],
						page,
						pageLength,
						confirmedPage.includes(page)
					)
				);
				collector.resetTimer();
				return;
			});
			collector.on('end', (collected) => {
				if (collected.size === 0) {
					interaction.editReply({
						content:
							'Sorry, you did not confirm your effort in time. Please click the button again.',
						components: [],
						embeds: []
					});
				}
			});
			return;
		}

		if (customId === ButtonCustomIdEnum.MentorDataShare) {
			const mentorResult = await mentorIdentity(interaction.user.id);

			if (mentorResult.isErr()) {
				return interaction.followUp({
					content: mentorResult.error.message
				});
			}
			let currentStatus = mentorResult.value.isDataShared;
			const replyMsg = await interaction.followUp(generateDataShareReply(currentStatus));
			const collector = replyMsg.createMessageComponentCollector({
				time: NUMBER.MENTORSHIP_DATA_SHARE_INTERVAL_IN_SEC * 1000,
				componentType: ComponentType.Button
			});

			collector.on('collect', async (btnInteraction) => {
				await ResultAsync.fromPromise(
					prisma.mentor.update({
						where: {
							id: interaction.user.id
						},
						data: {
							isDataShared: !currentStatus
						}
					}),
					() => new MongoDbError()
				)
					.map(async (mentor) => {
						collector.resetTimer();
						currentStatus = mentor.isDataShared;
						await btnInteraction.deferReply();
						await interaction.editReply(generateDataShareReply(currentStatus));
					})
					.mapErr((err) => {
						if (btnInteraction.deferred) {
							btnInteraction.followUp({
								content: err.message,
								ephemeral: true
							});
						} else {
							btnInteraction.reply({
								content: err.message,
								ephemeral: true
							});
						}
					});
			});
			collector.on('end', (collected) => {
				if (collected.size === 0) {
					interaction.editReply({
						content: 'Sorry, timeout. Please click the button again.'
					});
				}
			});
			return;
		}

		if (customId === ButtonCustomIdEnum.LeaderboardStatistics) {
			const optionResult = await ResultAsync.fromPromise(
				prisma.mentor.findMany({
					where: {
						discordId: guildId,
						isDataShared: true
					}
				}),
				() => new MongoDbError()
			).andThen((mentors) => {
				if (mentors.length === 0)
					return errAsync(
						new Error(
							'No mentor found, because no one shared their data or no one is a mentor in current server.'
						)
					);
				return okAsync(
					separateArray(
						mentors.map((value) => ({
							label: value.name,
							value: value.id
						})),
						25
					)
				);
			});

			if (optionResult.isErr()) {
				return interaction.followUp({
					content: optionResult.error.message
				});
			}
			const replyMsg = await interaction.followUp({
				content: sprintf(COMMAND_CONTENT.MENTORSHIP_STATISTICS_INTRODUCTION, {
					expire: dayjs().unix() + NUMBER.MENTORSHIP_STATISTICS_INTERVAL_IN_SEC
				}),
				components: [
					// todo the Max of mentors is 100, need to fix if we have more mentors
					new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
						optionResult.value
							.map((value, index) =>
								new StringSelectMenuBuilder()
									.setCustomId(`mentor_${index}`)
									.setPlaceholder('Select a mentor')
									.addOptions(value)
									.setMaxValues(1)
							)
							.slice(0, 5)
					)
				],
				fetchReply: true
			});
			const collector = replyMsg.createMessageComponentCollector({
				time: NUMBER.MENTORSHIP_STATISTICS_INTERVAL_IN_SEC * 1000,
				componentType: ComponentType.StringSelect
			});

			collector.on('collect', async (menuInteraction) => {
				await menuInteraction.deferUpdate();
				const mentorDetailResult = await ResultAsync.fromPromise(
					prisma.mentor.findFirst({
						where: {
							id: menuInteraction.values[0]
						}
					}),
					() => new MongoDbError()
				).andThen((mentor) => {
					if (!mentor) return errAsync(new Error('No mentor found.'));
					if (!mentor.isDataShared)
						return errAsync(new Error('This mentor did not share his/her data.'));
					return ResultAsync.fromPromise(
						prisma.reward.groupBy({
							where: {
								mentorId: menuInteraction.values[0],
								isConfirmed: true
							},
							by: ['epochId'],
							_sum: {
								claimedMins: true
							}
						}),
						() => new MongoDbError()
					);
				});

				if (mentorDetailResult.isErr()) {
					await menuInteraction.followUp({
						content: mentorDetailResult.error.message,
						ephemeral: true
					});
					await interaction.editReply({
						content: sprintf(COMMAND_CONTENT.MENTORSHIP_STATISTICS_INTRODUCTION, {
							expire: dayjs().unix() + NUMBER.MENTORSHIP_STATISTICS_INTERVAL_IN_SEC
						})
					});
					collector.resetTimer();
					return;
				}
				const mentorDetail = mentorDetailResult.value;

				if (mentorDetail.length === 0) {
					await menuInteraction.followUp({
						content:
							'No data found for this mentor, becasue the mentor may be deleted or not confirmed any effort yet.',
						ephemeral: true
					});
					await interaction.editReply({
						content: sprintf(COMMAND_CONTENT.MENTORSHIP_STATISTICS_INTRODUCTION, {
							expire: dayjs().unix() + NUMBER.MENTORSHIP_STATISTICS_INTERVAL_IN_SEC
						})
					});
					collector.resetTimer();
					return;
				}
				await interaction.editReply({
					content: null,
					components: [],
					embeds: [
						new EmbedBuilder()
							.setTitle(
								interaction.guild.members.cache.get(menuInteraction.values[0])
									?.displayName ?? 'Unknown Username'
							)
							.setDescription(
								mentorDetail
									.map(
										(value) =>
											`Epoch ${value.epochId}: \`${value._sum?.claimedMins}\` mins`
									)
									.join('\n')
							)
					]
				});
			});
			collector.on('end', (collected) => {
				if (collected.size === 0) {
					interaction.editReply({
						content:
							'Sorry, you did not select a mentor in time. Please click the button again.',
						components: []
					});
				}
			});
		}
	}
});

function getClaimEffortConent(interval: number) {
	return `Please choose your mentee and input your working mins. Note that this message will expire <t:${
		dayjs().unix() + interval
	}:R>`;
}

function getClaimEfforModal() {
	return new ModalBuilder()
		.setTitle('Claim your effort')
		.setCustomId(ModalCollectorCustomIdEnum.ClaimMentorEffort)
		.addComponents(
			new ActionRowBuilder<TextInputBuilder>().addComponents([
				new TextInputBuilder()
					.setCustomId('claim_mins')
					.setLabel('Input your working minutes')
					.setPlaceholder('Integer Only')
					.setStyle(TextInputStyle.Short)
			])
		);
}

function getConfirmEffortReply(
	intervalInSec: number,
	embed: EmbedBuilder,
	page: number,
	length: number,
	isConfirmed: boolean
): InteractionReplyOptions {
	return {
		content: sprintf(COMMAND_CONTENT.CONFIRM_EFFORT_CONTENT_TEMPLATE, {
			expire: dayjs().unix() + intervalInSec
		}),
		embeds: [embed],
		components: [
			...(isConfirmed
				? []
				: [
						new ActionRowBuilder<ButtonBuilder>().addComponents([
							new ButtonBuilder()
								.setCustomId(ButtonCollectorCustomId.ConfirmEffortYes)
								.setLabel('Yes, correct')
								.setEmoji('✅')
								.setStyle(ButtonStyle.Success),
							new ButtonBuilder()
								.setCustomId(ButtonCollectorCustomId.ConfirmEffortMessage)
								.setLabel('Leave a Message')
								.setEmoji('📨')
								.setStyle(ButtonStyle.Primary)
						])
				  ]),
			...(length === 1
				? // If only one effort to be confirmed, not display the page button
				  []
				: [
						new ActionRowBuilder<ButtonBuilder>().addComponents([
							new ButtonBuilder()
								.setCustomId(ButtonCollectorCustomId.First)
								.setLabel('First Page')
								.setEmoji('⏮️')
								.setStyle(ButtonStyle.Primary)
								.setDisabled(page === 0),
							new ButtonBuilder()
								.setCustomId(ButtonCollectorCustomId.Previous)
								.setEmoji('⬅️')
								.setStyle(ButtonStyle.Secondary)
								.setDisabled(page === 0),
							new ButtonBuilder()
								.setCustomId(ButtonCollectorCustomId.Next)
								.setEmoji('➡️')
								.setStyle(ButtonStyle.Secondary)
								.setDisabled(page === length - 1),
							new ButtonBuilder()
								.setCustomId(ButtonCollectorCustomId.Last)
								.setLabel('Last Page')
								.setEmoji('⏭️')
								.setStyle(ButtonStyle.Primary)
								.setDisabled(page === length - 1)
						])
				  ])
		]
	};
}

function generateDataShareReply(isDataShared: boolean): InteractionReplyOptions {
	return {
		content: isDataShared
			? `Your data has been shared with other members and displayed in the leaderboard. You can click the button below to stop sharing your data. Note that button will expire <t:${
					dayjs().unix() + NUMBER.MENTORSHIP_DATA_SHARE_INTERVAL_IN_SEC
			  }:R>`
			: `You can click the button below to share your data. Please note that your data will be shared with other members and displayed in the leaderboard. You can disable it anytime. Note that button will expire <t:${
					dayjs().unix() + NUMBER.MENTORSHIP_DATA_SHARE_INTERVAL_IN_SEC
			  }:R>`,
		components: [
			new ActionRowBuilder<ButtonBuilder>().addComponents(
				new ButtonBuilder()
					.setCustomId(ButtonCollectorCustomId.MentorDataShareChange)
					.setLabel(isDataShared ? 'Stop Sharing' : 'Start Sharing')
					.setStyle(ButtonStyle.Primary)
					.setEmoji(isDataShared ? '🔒' : '🔓')
			)
		],
		fetchReply: true
	};
}

function mentorIdentity(mentotId: string) {
	return ResultAsync.fromPromise(
		prisma.mentor.findUnique({
			where: {
				id: mentotId
			}
		}),
		() => new MongoDbError()
	).andThen((mentor) => (mentor ? okAsync(mentor) : errAsync(new MentorshipNotFoundError())));
}

function logClosedDM(notificationChannel: TextChannel | null, menteeId: string, mentorId: string) {
	return ResultAsync.fromPromise(
		notificationChannel.send({
			embeds: [
				new EmbedBuilder()
					.setTitle('Closed DM')
					.setDescription(
						`${userMention(
							mentorId
						)} DM is closed. Please contact him/her in other ways about ${userMention(
							menteeId
						)} refused claimed efforts.`
					)
			]
		}),
		() => new Error('Failed to send a message to notification channel.')
	);
}

function dmUser(targetUser: GuildMember | undefined, message: string) {
	return targetUser
		? ResultAsync.fromSafePromise(targetUser.createDM()).andThen((channel) =>
				ResultAsync.fromPromise(
					channel.send({ content: message }),
					() => new FailSendDmError(targetUser.displayName)
				)
		  )
		: errAsync(
				new Error(
					'Your action has been executed but I cannot find your mentor in Discord, so DM is not sent.'
				)
		  );
}
