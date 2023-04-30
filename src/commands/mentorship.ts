import { Mentorship, Prisma } from '@prisma/client';
import {
	ActionRowBuilder,
	APIEmbedField,
	ApplicationCommandOptionType,
	ApplicationCommandType,
	ButtonBuilder,
	ButtonInteraction,
	ButtonStyle,
	ChannelType,
	CommandInteractionOptionResolver,
	EmbedBuilder,
	Guild,
	GuildMember,
	InteractionReplyOptions,
	Message,
	TextChannel,
	UserSelectMenuBuilder,
	UserSelectMenuInteraction
} from 'discord.js';
import { err, ok, Result, ResultAsync } from 'neverthrow';
import { sprintf } from 'sprintf-js';

import { epochUpdate } from '../cron/cron';
import { prisma } from '../prisma/prisma';
import { myCache } from '../structures/Cache';
import { Command } from '../structures/Command';
import { ButtonCollectorCustomId, ButtonCustomIdEnum } from '../types/Button';
import { CommandNameEmun, ExtendedCommandInteration } from '../types/Command';
import {
	COMMAND_CONTENT,
	DefaultMentorshipConfig,
	MentorshipChannelOptionName,
	NUMBER
} from '../utils/const';
import dayjs from '../utils/dayjs';
import { logger } from '../utils/logger';
import {
	checkTextChannelPermission,
	fetchCommandId,
	isEpochEnd,
	startOfIsoWeekUnix
} from '../utils/util';

export default new Command({
	name: CommandNameEmun.Mentorship,
	description: 'Mentorship helper',
	type: ApplicationCommandType.ChatInput,
	options: [
		{
			type: ApplicationCommandOptionType.SubcommandGroup,
			description: 'Configure mentorship',
			name: 'configure',
			options: [
				{
					type: ApplicationCommandOptionType.Subcommand,
					name: 'admin_role',
					description: 'Add admin role for sub-commands',
					options: [
						{
							name: 'name',
							description: 'Choose a role as admin role',
							type: ApplicationCommandOptionType.Role,
							required: true
						}
					]
				},
				{
					type: ApplicationCommandOptionType.Subcommand,
					name: 'channel',
					description: 'Set up mentorship channels',
					options: [
						{
							name: MentorshipChannelOptionName.Playground,
							description: 'Choose a channel as a playground channel',
							type: ApplicationCommandOptionType.Channel,
							channelTypes: [ChannelType.GuildText]
						}
					]
				},
				{
					type: ApplicationCommandOptionType.Subcommand,
					name: 'token_reward',
					description: 'Set up the amount of token per mins',
					options: [
						{
							name: 'amount',
							description: 'Type an integer',
							type: ApplicationCommandOptionType.Integer,
							required: true
						}
					]
				},
				{
					type: ApplicationCommandOptionType.Subcommand,
					name: 'read',
					description: 'Display current mentorship configuration'
				}
			]
		},
		{
			type: ApplicationCommandOptionType.Subcommand,
			name: 'add_pair',
			description: 'Add mentor-mentee pair'
		},
		{
			type: ApplicationCommandOptionType.SubcommandGroup,
			name: 'fetch',
			description: 'Fetch mentors or mentees information.',
			options: [
				{
					type: ApplicationCommandOptionType.Subcommand,
					name: 'mentor',
					description: 'Fetch mentors information.',
					options: [
						{
							type: ApplicationCommandOptionType.String,
							name: 'name',
							description: 'Mentors list.',
							required: true,
							autocomplete: true
						}
					]
				},
				{
					type: ApplicationCommandOptionType.Subcommand,
					name: 'mentee',
					description: 'Fetch mentees information.',
					options: [
						{
							type: ApplicationCommandOptionType.String,
							name: 'name',
							description: 'Mentees list.',
							required: true,
							autocomplete: true
						}
					]
				}
			]
		},
		{
			type: ApplicationCommandOptionType.Subcommand,
			name: 'start_epoch',
			description: 'Start the next epoch to gather mentorship information.'
		},
		{
			type: ApplicationCommandOptionType.Subcommand,
			name: 'end_epoch',
			description: 'End to gather mentorship information in the next epoch.'
		},
		{
			type: ApplicationCommandOptionType.SubcommandGroup,
			name: 'collect',
			description: 'Collect mentorship based on epoch.',
			options: [
				{
					name: 'latest',
					description: 'Collect latest/current epoch information',
					type: ApplicationCommandOptionType.Subcommand
				},
				{
					name: 'all',
					description: 'Collect all epoch information',
					type: ApplicationCommandOptionType.Subcommand
				},
				{
					name: 'one',
					description: 'Collect one epoch information',
					type: ApplicationCommandOptionType.Subcommand,
					options: [
						{
							name: 'epoch',
							description: "Choose which epoch you'd like to collect",
							type: ApplicationCommandOptionType.String,
							required: true,
							autocomplete: true
						}
					]
				}
			]
		}
	],
	execute: async ({ interaction, args }) => {
		const subCommandGroupName = args.getSubcommandGroup();
		const subCommandName = args.getSubcommand();
		const guildId = interaction.guildId;

		if (subCommandGroupName === 'configure') {
			try {
				switch (subCommandName) {
					case 'admin_role':
						await _handleAdminRole(interaction, args);
						break;
					case 'channel':
						await _handleChannelSetting(interaction, args);
						break;
					case 'token_reward':
						await _handleTokenReward(interaction, args);
						break;
					case 'read':
						_readCurrentConfig(interaction);
						break;
				}
			} catch (e: unknown) {
				if (
					e instanceof Prisma.PrismaClientKnownRequestError ||
					e instanceof Prisma.PrismaClientValidationError ||
					e instanceof Prisma.PrismaClientUnknownRequestError
				) {
					logger.error(e);
					return interaction.followUp({
						content: 'Failed to upload data to the database, please try again later.'
					});
				}
				throw e;
			}
			return;
		}

		if (subCommandGroupName === 'fetch') {
			const { guildId } = interaction;

			await interaction.deferReply({ ephemeral: true });
			try {
				switch (subCommandName) {
					case 'mentor':
						return interaction.followUp(
							await _fetchMentor(args.getString('name'), guildId)
						);
					case 'mentee':
						return interaction.followUp(
							await _fetchMentee(args.getString('name'), guildId)
						);
				}
			} catch (e: unknown) {
				return interaction.followUp({
					content: 'Failed to upload data to the database, please try again later.'
				});
			}
		}

		if (subCommandName === 'add_pair') {
			const replyMsg = await interaction.reply({
				content: sprintf(COMMAND_CONTENT.MENTORSHIP_ADD_PAIR_INTRODUCTION, {
					expire: dayjs().unix() + NUMBER.ADD_PAIR_INTERVAL_IN_SEC
				}),
				components: [
					new ActionRowBuilder<UserSelectMenuBuilder>().addComponents([
						new UserSelectMenuBuilder()
							.setCustomId('mentor_selection')
							.setPlaceholder('Please choose one mentor from the list')
					]),
					new ActionRowBuilder<UserSelectMenuBuilder>().addComponents([
						new UserSelectMenuBuilder()
							.setCustomId('mentee_selection')
							.setPlaceholder('Please choose at least one mentee from the list')
							.setMinValues(0)
							.setMaxValues(10)
					]),
					new ActionRowBuilder<ButtonBuilder>().addComponents([
						new ButtonBuilder()
							.setCustomId(ButtonCollectorCustomId.PairConfirm)
							.setLabel('Confirm')
							.setStyle(ButtonStyle.Primary)
					])
				],
				fetchReply: true,
				ephemeral: true
			});

			const collector = replyMsg.createMessageComponentCollector({
				time: NUMBER.ADD_PAIR_INTERVAL_IN_SEC * 1000,
				idle: NUMBER.ADD_PAIR_IDLE_INTERVAL_IN_SEC * 1000
			});
			const data: MentorshipUserInform = {
				mentees: []
			};

			collector.on(
				'collect',
				async (collectedInteraction: UserSelectMenuInteraction | ButtonInteraction) => {
					if (collectedInteraction instanceof UserSelectMenuInteraction) {
						await collectedInteraction.deferUpdate();
						const members = [
							...collectedInteraction.members.values()
						] as Array<GuildMember>;

						if (collectedInteraction.customId === 'mentor_selection') {
							data.mentor = members[0];
						} else {
							data.mentees = members;
						}
					} else {
						await collectedInteraction.deferUpdate();
						const inputCheck =
							data.mentees.length === 0
								? err('Please select at least one mentee.')
								: !data.mentor
								? err('Please select mentor first.')
								: data.mentees.map((value) => value.id).includes(data.mentor.id)
								? err('Mentee cannot include mentor himself/herself.')
								: ok(null);

						if (inputCheck.isErr()) {
							await collectedInteraction.followUp({
								content: inputCheck.error,
								ephemeral: true
							});
						}
						collector.stop();
					}
				}
			);

			collector.on('end', async (collected) => {
				if (collected.size === 0) {
					const { commandName, guild } = interaction;
					const mentorshipCommandId = fetchCommandId(commandName, guild);

					await interaction.editReply({
						content: `Sorry, time out. Please run </${interaction.commandName} add_pair:${mentorshipCommandId}> again.`,
						components: []
					});
					return;
				}
				const result = await addPair(data);

				if (result.isErr()) {
					await interaction.editReply({
						content: 'Failed to add pair, please try again later.',
						components: []
					});
					return;
				}

				await interaction.editReply({
					content: `Now <@${data.mentor.id}> pairs with ${data.mentees
						.map((mentee) => `<@${mentee.id}>`)
						.toString()}.`,
					components: []
				});
				return;
			});
			return;
		}

		if (subCommandName === 'start_epoch') {
			const { isEpochStarted } = myCache.myGet('MentorshipConfig')[guildId];

			if (isEpochStarted) {
				const { startTimestamp, endTimestamp } = myCache.myGet('CurrentEpoch')[guildId];

				return interaction.reply({
					content: `Sorry, epoch has started from <t:${startTimestamp}:f> to <t:${endTimestamp}:f>.`,
					ephemeral: true
				});
			}
			const startTimestamp = startOfIsoWeekUnix().toString();
			const endTimestamp = epochUpdate.getNextEpochEndUnixTime().toString();

			await interaction.deferReply({ ephemeral: true });
			return ResultAsync.fromPromise(
				prisma.$transaction([
					prisma.mentorship.update({
						where: {
							discordId: guildId
						},
						data: {
							isEpochStarted: true
						}
					}),
					prisma.epoch.create({
						data: {
							discordId: guildId,
							startTimestamp,
							endTimestamp
						}
					})
				]),
				() => {
					interaction.followUp({
						content: `Sorry, something went wrong. Please try again.`,
						ephemeral: true
					});
				}
			).map(([newMentorshipConfig, currentEpoch]) => {
				myCache.mySet('MentorshipConfig', {
					[guildId]: newMentorshipConfig
				});
				myCache.mySet('CurrentEpoch', {
					[guildId]: currentEpoch
				});
				return interaction.followUp({
					content: `Epoch has started from <t:${startTimestamp}:f> to <t:${endTimestamp}:f>.`,
					ephemeral: true
				});
			});
		}

		if (subCommandName === 'end_epoch') {
			const { isEpochStarted } = myCache.myGet('MentorshipConfig')[guildId];

			if (!isEpochStarted) {
				return interaction.reply({
					content: `Sorry, epoch is not started.`,
					ephemeral: true
				});
			}
			await interaction.deferReply({ ephemeral: true });
			return ResultAsync.fromPromise(
				prisma.mentorship.update({
					where: {
						discordId: guildId
					},
					data: {
						isEpochStarted: false
					}
				}),
				() => {
					interaction.followUp({
						content: `Sorry, something went wrong. Please try again.`,
						ephemeral: true
					});
				}
			).map((newConfig) => {
				myCache.mySet('MentorshipConfig', {
					[guildId]: newConfig
				});

				return interaction.followUp({
					content: 'Epoch has ended.'
				});
			});
		}

		if (subCommandName === 'collect') {
			if (!myCache.myHas('CurrentEpoch')) {
				const commandId = fetchCommandId(interaction.commandName, interaction.guild);

				return interaction.reply({
					content: `Sorry, epoch is not started. Please use </${interaction.commandName} start_epoch:${commandId}> to launch an epoch.`,
					ephemeral: true
				});
			}

			return interaction.reply({
				content: 'WIP',
				ephemeral: true
			});
		}
	}
});

interface MentorshipUserInform {
	mentor?: GuildMember;
	mentees: Array<GuildMember>;
}

async function _handleAdminRole(
	interaction: ExtendedCommandInteration,
	args: CommandInteractionOptionResolver
) {
	const { guildId } = interaction;
	const currentConfig = myCache.myGet('MentorshipConfig')[guildId];
	const roleId = args.getRole('name').id;

	delete currentConfig.discordId;
	await interaction.deferReply({ ephemeral: true });
	if (roleId !== currentConfig.adminRole) {
		await prisma.mentorship.update({
			where: {
				discordId: guildId
			},
			data: {
				adminRole: roleId
			}
		});
		myCache.mySet('MentorshipConfig', {
			[guildId]: {
				...currentConfig,
				adminRole: roleId
			}
		});
	}

	return interaction.followUp({
		content: `<@&${roleId}> has been set as adminRole of mentorship`
	});
}

async function _handleChannelSetting(
	interaction: ExtendedCommandInteration,
	args: CommandInteractionOptionResolver
) {
	const channelOptions = args.data[0].options[0].options;

	if (channelOptions.length === 0) {
		return interaction.reply({
			content: 'Sorry, you have to choose at least one options.',
			ephemeral: true
		});
	}

	await interaction.deferReply({ ephemeral: true });
	const { guildId } = interaction;
	const currentConfig = myCache.myGet('MentorshipConfig')[guildId];

	delete currentConfig.discordId;
	type PrismaChannelProperty<T> = {
		// eslint-disable-next-line no-unused-vars
		[K in keyof T]: K extends `${infer Left}Channel` ? K : never;
	}[keyof T];

	const optionNameToPrismaProperty: Record<
		MentorshipChannelOptionName,
		PrismaChannelProperty<Mentorship>
	> = {
		playground: 'playgroundChannel'
	};
	const successReplyArray: Array<string> = [];
	const failReplyArray: Array<string> = [];
	const botId = interaction.guild.members.me.id;

	for (const option of channelOptions) {
		const { name: channelOptionName, value: targetChannelId } = option;
		const targetChannel = option.channel as TextChannel;
		const permissionChecking = checkTextChannelPermission(targetChannel, botId);

		if (permissionChecking) {
			failReplyArray.push(
				sprintf(COMMAND_CONTENT.CHANNEL_SETTING_FAIL_REPLY, {
					setChannelName: channelOptionName,
					targetChannelId: targetChannelId,
					reason: permissionChecking
				})
			);
			continue;
		}

		if (channelOptionName === MentorshipChannelOptionName.Playground) {
			const result = await initPlaygroundChannel(targetChannel);

			if (result.isErr()) {
				failReplyArray.push(
					sprintf(COMMAND_CONTENT.CHANNEL_SETTING_FAIL_REPLY, {
						setChannelName: channelOptionName,
						targetChannelId: targetChannelId,
						reason: result.error.message
					})
				);
				continue;
			}
			currentConfig.playgroundChannelMsgId = result.value.id;
		}

		successReplyArray.push(
			sprintf(COMMAND_CONTENT.CHANNEL_SETTING_SUCCESS_REPLY, {
				setChannelName: channelOptionName,
				targetChannelId: targetChannelId
			})
		);
		const prismaPropertyName = optionNameToPrismaProperty[channelOptionName];

		currentConfig[prismaPropertyName] =
			targetChannelId !== currentConfig[prismaPropertyName]
				? targetChannelId
				: currentConfig[prismaPropertyName];
	}

	if (successReplyArray.length !== 0) {
		const result = await ResultAsync.fromPromise(
			prisma.mentorship.update({
				where: {
					discordId: process.env.GUILDID
				},
				data: {
					...currentConfig
				}
			}),
			(err: Error) => err
		).map(() =>
			myCache.mySet('MentorshipConfig', {
				[guildId]: currentConfig
			})
		);

		if (result.isErr()) {
			return interaction.followUp({
				content:
					'Sorry, error occurs when updating mentorship configuration. Please try again.'
			});
		}
	}

	const successReply = successReplyArray.reduce((pre, cur) => {
		return pre + cur + '\n';
	}, '');

	const failReply = failReplyArray.reduce((pre, cur) => {
		return pre + cur + '\n';
	}, '');

	return interaction.followUp({
		content: successReply + failReply
	});
}

export function getPlaygroundChannel(guild: Guild): Result<TextChannel, null> {
	if (!myCache.myHas('MentorshipConfig')) return err(null);
	const { playgroundChannelMsgId, playgroundChannel: playgroundChannelId } =
		myCache.myGet('MentorshipConfig')[guild.id];

	if (!playgroundChannelId || !playgroundChannelMsgId) return err(null);
	const playgroundChannel = guild.channels.cache.get(playgroundChannelId) as TextChannel;

	if (!playgroundChannel) return err(null);
	if (checkTextChannelPermission(playgroundChannel, guild.members.me.id)) return err(null);
	return ok(playgroundChannel);
}

export function initPlaygroundChannel(
	targetChannel: TextChannel
): ResultAsync<Message<boolean>, Error> {
	const { guildId } = targetChannel;
	const currentEpoch = myCache.myGet('CurrentEpoch')?.[guildId];
	const mentorshipConfig = myCache.myGet('MentorshipConfig')?.[guildId];

	return ResultAsync.fromPromise(
		prisma.$transaction([
			prisma.mentor.count(),
			prisma.mentee.count(),
			prisma.reward.aggregate({
				where: {
					epochId: currentEpoch?.id,
					discordId: guildId
				},
				_sum: {
					claimedMins: true
				}
			}),
			prisma.reward.aggregateRaw({
				pipeline: [
					{ $match: { isConfirmed: true } },
					{
						$group: {
							_id: {
								mentorId: '$mentorId',
								menteeId: '$menteeId',
								epochId: '$epochId'
							},
							claimedMins: { $sum: '$claimedMins' },
							count: { $sum: 1 }
						}
					},
					{
						$group: {
							_id: { mentorId: '$_id.mentorId', menteeId: '$_id.menteeId' },
							totalClaimedMins: { $sum: '$claimedMins' },
							avgClaimedMinsPerEpoch: { $avg: '$claimedMins' }
						}
					},
					{
						$project: {
							_id: 0,
							mentorId: '$_id.mentorId',
							menteeId: '$_id.menteeId',
							totalClaimedMins: 1,
							totalCode: {
								$multiply: ['$totalClaimedMins', 60]
							},
							avgClaimedMinsPerEpoch: 1
						}
					}
				]
			}) as unknown as Prisma.PrismaPromise<
				Array<{
					totalClaimedMins: number;
					avgClaimedMinsPerEpoch: number;
					totalCode: number;
					mentorId: string;
					menteeId: string;
				}>
			>
		]),
		(err: Error) => err
	).map(([mentorNo, menteeNo, confirmedMins, leaderboardValue]) => {
		return targetChannel.send({
			content: sprintf(COMMAND_CONTENT.MENTORSHIP_PLAYGROUND_EMBEDD_TEMPLATE, {
				epochInformation: isEpochEnd()
					? 'Waiting for epoch start.'
					: `<t:${currentEpoch.startTimestamp}> => <t:${currentEpoch.endTimestamp}>`,
				confirmedMins: confirmedMins._sum.claimedMins ?? 0,
				mentorNo,
				menteeNo,
				confirmedCode: mentorshipConfig.tokenPerMin * confirmedMins._sum.claimedMins
			}),
			embeds: [
				new EmbedBuilder().setTitle('Mentorship Dashboard').setDescription(
					leaderboardValue.reduce(
						(
							acc,
							{
								totalClaimedMins,
								avgClaimedMinsPerEpoch,
								totalCode,
								menteeId,
								mentorId
							}
						) => {
							return `${acc}<@${mentorId}>, <@${menteeId}>, ${avgClaimedMinsPerEpoch.toFixed(
								2
							)}, ${totalClaimedMins}, ${totalCode}\n`;
						},
						'Mentor, Mentee, Avg Claimed Mins Per Epoch, Total Claimed Mins, Total Code\n'
					)
				)
			],
			components: [
				new ActionRowBuilder<ButtonBuilder>().addComponents([
					new ButtonBuilder()
						.setCustomId(ButtonCustomIdEnum.ClaimMentorEffort)
						.setLabel('Claim Working Period')
						.setStyle(ButtonStyle.Primary)
						.setEmoji('⏲️'),
					new ButtonBuilder()
						.setCustomId(ButtonCustomIdEnum.ConfirmMentorEffort)
						.setLabel('Confirm Mentor Efforts')
						.setStyle(ButtonStyle.Secondary)
						.setEmoji('✅')
				]),
				new ActionRowBuilder<ButtonBuilder>().addComponents([
					new ButtonBuilder()
						.setCustomId(ButtonCustomIdEnum.MentorDataShare)
						.setLabel('Mentor Privacy Setting')
						.setStyle(ButtonStyle.Danger)
						.setEmoji('🔏'),
					new ButtonBuilder()
						.setCustomId(ButtonCustomIdEnum.LeaderboardStatistics)
						.setLabel('Leaderboard Detail')
						.setStyle(ButtonStyle.Success)
						.setEmoji('📖')
				])
			]
		});
	});
}

async function _handleTokenReward(
	interaction: ExtendedCommandInteration,
	args: CommandInteractionOptionResolver
) {
	const { guildId } = interaction;
	const currentConfig = myCache.myGet('MentorshipConfig')[guildId];
	const rewardAmount = args.getInteger('amount');

	delete currentConfig.discordId;
	await interaction.deferReply({ ephemeral: true });
	if (rewardAmount !== currentConfig.tokenPerMin) {
		await prisma.mentorship.update({
			where: {
				discordId: guildId
			},
			data: {
				tokenPerMin: rewardAmount
			}
		});
		myCache.mySet('MentorshipConfig', {
			[guildId]: {
				...currentConfig,
				tokenPerMin: rewardAmount
			}
		});
	}

	return interaction.followUp({
		content: `Now, mentor reward has been adjusted to ${rewardAmount} CODE per minuter`
	});
}

function _readCurrentConfig(interaction: ExtendedCommandInteration) {
	const { guildId } = interaction;
	const currentConfig = myCache.myGet('MentorshipConfig')[guildId];
	const embedFields: APIEmbedField[] = [
		{
			name: 'Admin Role',
			value: currentConfig.adminRole
				? currentConfig.adminRole === DefaultMentorshipConfig.adminRole
					? '`everyone`'
					: `<@&${currentConfig.adminRole}>`
				: '`Unavailable`'
		},
		{
			name: 'Token Reward',
			value: currentConfig.tokenPerMin.toString()
		},
		{
			name: 'Playground Channel',
			value: currentConfig.playgroundChannel
				? `<#${currentConfig.playgroundChannel}>`
				: '`Unavailable`',
			inline: true
		}
	];

	return interaction.reply({
		embeds: [
			new EmbedBuilder()
				.setTitle(`${interaction.guild.name} Mentorship Configuration`)
				.addFields(embedFields)
		],
		ephemeral: true
	});
}

function addPair(inform: MentorshipUserInform): ResultAsync<null, Error> {
	const discordId = process.env.GUILDID;
	const mentorId = inform.mentor.id;
	const mentorName = inform.mentor.displayName;

	// Update mentee and mentor
	return ResultAsync.fromPromise(
		prisma.$transaction([
			prisma.mentor.upsert({
				create: {
					discordId,
					menteesRef: inform.mentees.map((mentee) => mentee.id),
					name: mentorName,
					id: mentorId
				},
				where: {
					id: mentorId
				},
				update: {
					menteesRef: inform.mentees.map((mentee) => mentee.id),
					name: mentorName
				}
			}),
			...inform.mentees.map((mentee) =>
				prisma.mentee.upsert({
					create: {
						discordId,
						name: mentee.displayName,
						id: mentee.id,
						mentorName,
						mentorId
					},
					where: {
						id: mentee.id
					},
					update: {
						name: mentee.displayName,
						mentorName,
						mentorId
					}
				})
			)
		]),
		(err: Error) => err
	).map(() => null);
}

async function _fetchMentor(id: string, discordId: string): Promise<InteractionReplyOptions> {
	const mentor = await prisma.mentor.findFirst({
		cursor: {
			id
		},
		where: {
			discordId
		}
	});

	return mentor
		? {
				embeds: [
					new EmbedBuilder()
						.setTitle(`${mentor.name} Information`)
						.setDescription(
							`Discord Profile: <@${mentor.id}>\nMentees: ${
								mentor.menteesRef.length === 0
									? 0
									: mentor.menteesRef
											.map((menteeId) => `<@${menteeId}>`)
											.toString()
							}`
						)
				]
		  }
		: {
				content:
					'Sorry, we cannot find this mentor. Please check your input or this mentor is not registered.'
		  };
}

async function _fetchMentee(id: string, discordId: string): Promise<InteractionReplyOptions> {
	const mentee = await prisma.mentee.findFirst({
		cursor: {
			id
		},
		where: {
			discordId
		}
	});

	return mentee
		? {
				embeds: [
					new EmbedBuilder()
						.setTitle(`${mentee.name} Information`)
						.setDescription(
							`Discord Profile: <@${mentee.id}>\nMentor: ${
								mentee.mentorId ? `<@${mentee.mentorId}>` : `Unavailable`
							}`
						)
				]
		  }
		: {
				content:
					'Sorry, we cannot find this mentee. Please check your input or this mentee is not registered.'
		  };
}
