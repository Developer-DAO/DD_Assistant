import { Mentorship, Prisma } from '@prisma/client';
import dayjs from 'dayjs';
import {
	ActionRowBuilder,
	APIEmbedField,
	ApplicationCommandOptionType,
	ApplicationCommandType,
	ButtonInteraction,
	ChannelType,
	CommandInteractionOptionResolver,
	ComponentType,
	EmbedBuilder,
	GuildMember,
	InteractionReplyOptions,
	TextChannel,
	UserSelectMenuBuilder,
	UserSelectMenuInteraction
} from 'discord.js';
import { sprintf } from 'sprintf-js';

import { prisma } from '../prisma/prisma';
import { myCache } from '../structures/Cache';
import { Command } from '../structures/Command';
import { CommandNameEmun, ExtendedCommandInteration } from '../types/Command';
import { Result } from '../types/Result';
import { COMMAND_CONTENT, NUMBER } from '../utils/const';
import { logger } from '../utils/logger';
import { checkTextChannelPermission, fetchCommandId } from '../utils/util';

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
							name: 'playground',
							description: 'Choose a channel as a playground channel',
							type: ApplicationCommandOptionType.Channel,
							channelTypes: [ChannelType.GuildText]
						},
						{
							name: 'mentor',
							description: 'Choose a channel as a mentor channel',
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
			const expireInMilsec = NUMBER.ADD_PAIR_INTERVAL;
			const expireInSec = Math.floor(expireInMilsec / 1000);
			const idleInMilsec = 1 * 60 * 1000;
			const idleInSec = Math.floor(idleInMilsec / 1000);
			const replyMsg = await interaction.reply({
				content: `Please select one mentor and corresponding mentees. After you finish, please click the button to confirm your choice. Please note that this message will expire when idle reaches ${idleInSec} secs or <t:${expireInSec}:R>. Once it expires, you have to run the command again.`,
				components: [
					new ActionRowBuilder<UserSelectMenuBuilder>().addComponents([
						new UserSelectMenuBuilder()
							.setCustomId('mentor_selection')
							.setPlaceholder('Please choose one mentor from the list')
							.setMaxValues(1)
					]),
					new ActionRowBuilder<UserSelectMenuBuilder>().addComponents([
						new UserSelectMenuBuilder()
							.setCustomId('mentee_selection')
							.setPlaceholder('Please choose at least one mentee from the list')
							.setMinValues(1)
							.setMaxValues(10)
					])
				],
				fetchReply: true,
				ephemeral: true
			});

			const collector = replyMsg.createMessageComponentCollector({
				componentType: ComponentType.UserSelect | ComponentType.Button,
				time: expireInMilsec,
				idle: idleInMilsec
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
						collector.stop();
					}
				}
			);

			collector.on('end', async (collected) => {
				if (
					collected.size === 0 ||
					!collected.find((value) => value instanceof ButtonInteraction)
				) {
					const { commandName, guild } = interaction;
					const mentorshipCommandId = fetchCommandId(commandName, guild);

					await interaction.editReply({
						content: `Sorry, time out. Please run </${interaction.commandName} add_pair:${mentorshipCommandId}> again.`,
						components: []
					});
					return;
				}
				const result = await _addPair(data);

				if (result.is_err()) {
					await interaction.editReply({
						content: result.error.message,
						components: []
					});
				}

				await interaction.editReply({
					content: `Now <@${data.mentor.id}> pairs with ${data.mentees
						.map((mentee) => `<@${mentee.id}>`)
						.toString()}.`,
					components: []
				});
			});
			return;
		}

		if (subCommandName === 'start_epoch') {
			await interaction.deferReply({
				ephemeral: true
			});
			const currentEpoch = await prisma.epoch.findFirst({
				orderBy: {
					startTimestamp: 'desc'
				}
			});

			if (!currentEpoch) {
				const epoch = await prisma.epoch.create({
					data: {
						startTimestamp: new Date(),
						endTimestamp: dayjs().add(7, 'day').toDate(),
						discordId: interaction.guildId
					}
				});

				myCache.mySet('CurrentEpoch', epoch);
				return interaction.followUp({
					content: `You have started the epoch.\nCurrent Epoch: <t:${Math.floor(
						epoch.startTimestamp.getTime() / 1000
					)}:f> to <t:${Math.floor(epoch.endTimestamp.getTime() / 1000)}:f>`
				});
			}

			return interaction.followUp({
				content: `Sorry, epoch has been started.\nCurrent Epoch: <t:${Math.floor(
					currentEpoch.startTimestamp.getTime() / 1000
				)}:f> to <t:${Math.floor(currentEpoch.endTimestamp.getTime() / 1000)}:f>`
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

	type ChannelOptionName = 'playground' | 'mentor';
	type PrismaChannelProperty<T> = {
		// eslint-disable-next-line no-unused-vars
		[K in keyof T]: K extends `${infer Left}Channel` ? K : never;
	}[keyof T];

	const optionNameToPrismaProperty: Record<
		ChannelOptionName,
		PrismaChannelProperty<Mentorship>
	> = {
		mentor: 'mentorChannel',
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
				sprintf(
					sprintf(COMMAND_CONTENT.CHANNEL_SETTING_FAIL_REPLY, {
						setChannelName: channelOptionName,
						targetChannelId: targetChannelId,
						reason: permissionChecking
					})
				)
			);
			continue;
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
		await prisma.guilds.update({
			where: {
				discordId: process.env.GUILDID
			},
			data: {
				...currentConfig
			}
		});

		myCache.mySet('MentorshipConfig', {
			[guildId]: currentConfig
		});
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

async function _handleTokenReward(
	interaction: ExtendedCommandInteration,
	args: CommandInteractionOptionResolver
) {
	const { guildId } = interaction;
	const currentConfig = myCache.myGet('MentorshipConfig')[guildId];
	const rewardAmount = args.getInteger('amount');

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
		},
		{
			name: 'Token Reward',
			value: currentConfig.tokenPerMin.toString()
		},
		{
			name: 'Mentor Channel',
			value: currentConfig.mentorChannel
				? `Unavailable`
				: `<#${currentConfig.mentorChannel}>`,
			inline: true
		},
		{
			name: 'Playground Channel',
			value: currentConfig.playgroundChannel
				? `Unavailable`
				: `<#${currentConfig.playgroundChannel}>`,
			inline: true
		}
	];

	return interaction.reply({
		embeds: [
			new EmbedBuilder()
				.setTitle(`${interaction.guild.name} Mentorship Configuration`)
				.addFields(embedFields)
		]
	});
}

async function _addPair(inform: MentorshipUserInform): Promise<Result<void, Error>> {
	if (!inform.mentor) {
		return Result.Err(
			new Error('Sorry, you have to choose one menter before you confirm this pair.')
		);
	}

	if (inform.mentees.length === 0) {
		return Result.Err(
			new Error('Sorry, you have to choose at least one mentee before you confirm this pair.')
		);
	}

	if (inform.mentees.map((mentee) => mentee.id).includes(inform.mentor.id)) {
		return Result.Err(
			new Error(`Sorry, <@${inform.mentor.id}> cannot be mentor and mentee at the same time.`)
		);
	}

	const discordId = process.env.GUILDID;
	const mentorId = inform.mentor.id;
	const mentorName = inform.mentor.displayName;
	const results = await Promise.allSettled(
		inform.mentees.map((mentee) =>
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
	);
	const errors = results.filter((value) => value.status === 'rejected');

	if (errors.length !== 0) {
		logger.error(errors[0]);
		return Result.Err(
			new Error('Sorry, failed to update data. Please report this to the admin.')
		);
	}

	try {
		await prisma.mentor.upsert({
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
		});
	} catch (error) {
		logger.error(error);
		return Result.Err(
			new Error('Sorry, failed to update data.  Please report this to the admin.')
		);
	}
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
