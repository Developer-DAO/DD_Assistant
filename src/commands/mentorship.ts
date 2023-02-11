import { Mentorship, Prisma } from '@prisma/client';
import {
	APIEmbedField,
	ApplicationCommandOptionType,
	ApplicationCommandType,
	ChannelType,
	CommandInteractionOptionResolver,
	EmbedBuilder,
	TextChannel
} from 'discord.js';
import { sprintf } from 'sprintf-js';

import { prisma } from '../prisma/prisma';
import { myCache } from '../structures/Cache';
import { Command } from '../structures/Command';
import { CommandNameEmun, ExtendedCommandInteration } from '../types/Command';
import { COMMAND_CONTENT } from '../utils/const';
import { checkTextChannelPermission } from '../utils/util';

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
			description: 'Add mentor-mentee pair',
			options: [
				{
					name: 'mentor',
					description: 'Choose the mentor',
					type: ApplicationCommandOptionType.User,
					required: true
				},
				{
					name: 'mentee',
					description: 'Choose the mentees, mention mentees in this option.',
					type: ApplicationCommandOptionType.String,
					required: true
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

		if (subCommandGroupName === 'add_pair') {
		}

		if (subCommandGroupName === 'start_epoch') {
		}

		if (subCommandGroupName === 'collect') {
		}
	}
});

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
