import { ApplicationCommandOptionType, ApplicationCommandType, ChannelType, EmbedBuilder, TextChannel } from 'discord.js';
import { sprintf } from 'sprintf-js';

import { prisma } from '../prisma/prisma';
import { myCache } from '../structures/Cache';
import { Command } from '../structures/Command';
import { GuildInform } from '../types/Cache';
import {
	ChannelOptionName,
	channelOptionNameToDBPropery,
	COMMAND_CHOICES,
	COMMAND_CONTENT
} from '../utils/const';
import {
	checkChannelPermission,
	checkIntroductionChannelPermission,
	readGuildInform,
	stickyMsgHandler
} from '../utils/util';

export default new Command({
	name: 'guild',
	description: 'Guild Configuration',
	type: ApplicationCommandType.ChatInput,
	options: [
		{
			type: ApplicationCommandOptionType.SubcommandGroup,
			name: 'set',
			description: 'Set in the Discord',
			options: [
				{
					type: ApplicationCommandOptionType.Subcommand,
					name: 'channel',
					description: 'Set channels in the Discord Server',
					options: [
						{
							type: ApplicationCommandOptionType.Channel,
							name: ChannelOptionName.celebration,
							description:
								'Set a Celebration Channel, where members can receive brithday messages and other blessing',
							channelTypes: [ChannelType.GuildText]
						},
						{
							type: ApplicationCommandOptionType.Channel,
							name: ChannelOptionName.notification,
							description:
								'Set a Notification Channel, where SAT members will be notified with channel changes',
							channelTypes: [ChannelType.GuildText]
						},
						{
							type: ApplicationCommandOptionType.Channel,
							name: ChannelOptionName.introduction,
							description:
								'Set a Introduction Channel, which members introduce themselves',
							channelTypes: [ChannelType.GuildText]
						},
						{
							type: ApplicationCommandOptionType.Channel,
							name: ChannelOptionName.women_introduction,
							description:
								'Set a DevDAO Women Introcution Channel, which members introduce themselves',
							channelTypes: [ChannelType.GuildText]
						},
						{
							type: ApplicationCommandOptionType.Channel,
							name: ChannelOptionName.onboarding,
							description:
								'Set a Onboarding Voice Channel, which we hold the onboarding calls',
							channelTypes: [ChannelType.GuildVoice]
						},
						{
							type: ApplicationCommandOptionType.Channel,
							name: ChannelOptionName.onboarding_notification,
							description:
								'Set a Onboarding Notification Channel, which teams can receive the event of thread Creation',
							channelTypes: [ChannelType.GuildText, ChannelType.PublicThread]
						},
						{
							type: ApplicationCommandOptionType.Channel,
							name: ChannelOptionName.archive,
							description:
								'Set a Archive Category Channel, which the bot will exclude it during the channel scan',
							channelTypes: [ChannelType.GuildCategory]
						}
					]
				},
				{
					type: ApplicationCommandOptionType.Subcommand,
					name: 'read',
					description: 'Read current configuration'
				}
			]
		},
		{
			type: ApplicationCommandOptionType.SubcommandGroup,
			name: 'add',
			description: 'Admin setting in the Discord Server',
			options: [
				{
					type: ApplicationCommandOptionType.Subcommand,
					name: 'admin_role',
					description: 'Admin role setting',
					options: [
						{
							type: ApplicationCommandOptionType.Role,
							name: 'role',
							description: 'choose an role',
							required: true
						}
					]
				},
				{
					type: ApplicationCommandOptionType.Subcommand,
					name: 'admin_member',
					description: 'Admin member setting',
					options: [
						{
							type: ApplicationCommandOptionType.User,
							name: 'member',
							description: 'choose a user',
							required: true
						}
					]
				},
				{
					type: ApplicationCommandOptionType.Subcommand,
					name: 'admin_command',
					description: 'Admin command setting',
					options: [
						{
							type: ApplicationCommandOptionType.String,
							name: 'command',
							description: 'choose a command',
							required: true,
							choices: COMMAND_CHOICES
						}
					]
				}
			]
		},
		{
			type: ApplicationCommandOptionType.SubcommandGroup,
			name: 'remove',
			description: 'Remove setting in the Discord Server',
			options: [
				{
					type: ApplicationCommandOptionType.Subcommand,
					name: 'admin_role',
					description: 'Remove admin role setting',
					options: [
						{
							type: ApplicationCommandOptionType.String,
							name: 'role',
							description: 'choose an role',
							autocomplete: true,
							required: true
						}
					]
				},
				{
					type: ApplicationCommandOptionType.Subcommand,
					name: 'admin_member',
					description: 'Remove admin member setting',
					options: [
						{
							type: ApplicationCommandOptionType.String,
							name: 'member',
							description: 'choose a user',
							autocomplete: true,
							required: true
						}
					]
				},
				{
					type: ApplicationCommandOptionType.Subcommand,
					name: 'admin_command',
					description: 'Admin command setting',
					options: [
						{
							type: ApplicationCommandOptionType.String,
							name: 'command',
							description: 'choose a command',
							autocomplete: true,
							required: true
						}
					]
				}
			]
		}
	],

	execute: async ({ interaction, args }) => {
		const subCommandGroupName = args.getSubcommandGroup();
		const subCommandName = args.getSubcommand();
		const { id: guildId, name: guildName } = interaction.guild;

		if (subCommandGroupName === 'set') {
			if (subCommandName === 'read') {
				const fields = readGuildInform(myCache.myGet('Guild')[guildId], guildId);
				const profileEmbed = new EmbedBuilder()
					.setTitle(`${guildName} Setting`)
					.addFields(fields);

				return interaction.reply({
					embeds: [profileEmbed],
					ephemeral: true
				});
			}

			if (subCommandName === 'channel') {
				const channelOptions = args.data[0].options[0].options;

				if (channelOptions.length === 0)
					return interaction.reply({
						content: 'Sorry, you have to choose at least one options.',
						ephemeral: true
					});
				await interaction.deferReply({ ephemeral: true });
				const cachedGuildInform = myCache.myGet('Guild')[guildId];

				const successReplyArray: Array<string> = [];
				const failReplyArray: Array<string> = [];
				const botId = interaction.guild.members.me.id;

				for (const option of channelOptions) {
					const { name: channelOptionName, value: channelId } = option;
					const targetChannel = option.channel as TextChannel;

					if (targetChannel.type === ChannelType.GuildText && !targetChannel.topic) {
						failReplyArray.push(
							sprintf(COMMAND_CONTENT.CHANNEL_SETTING_FAIL_REPLY, {
								setChannelName: channelOptionName,
								targetChannelId: channelId,
								reason: 'this channel does not have a topic'
							})
						);
						continue;
					}
					const permissionChecking = checkChannelPermission(targetChannel, botId);

					/// todo check whether channels have topic
					if (permissionChecking) {
						failReplyArray.push(
							sprintf(COMMAND_CONTENT.CHANNEL_SETTING_FAIL_REPLY, {
								setChannelName: channelOptionName,
								targetChannelId: channelId,
								reason: permissionChecking
							})
						);
						continue;
					}
					if (
						channelOptionName === 'introduction' ||
						channelOptionName === 'women_introduction'
					) {
						const permissionChecking = checkIntroductionChannelPermission(
							targetChannel,
							botId
						);

						if (permissionChecking) {
							failReplyArray.push(
								sprintf(COMMAND_CONTENT.CHANNEL_SETTING_FAIL_REPLY, {
									setChannelName: channelOptionName,
									targetChannelId: channelId,
									reason: permissionChecking
								})
							);
							continue;
						}
						const preChannelId = myCache.myGet('Guild')[guildId].channels[
							channelOptionNameToDBPropery[channelOptionName]
						] as string;

						if (preChannelId && preChannelId !== channelId) {
							const preChannel = interaction.guild.channels.cache.get(
								preChannelId
							) as TextChannel;

							stickyMsgHandler(targetChannel, botId, preChannel);
						} else {
							stickyMsgHandler(targetChannel, botId);
						}
					}
					successReplyArray.push(
						sprintf(COMMAND_CONTENT.CHANNEL_SETTING_SUCCESS_REPLY, {
							setChannelName: channelOptionName,
							targetChannelId: channelId
						})
					);
					if (channelId !== cachedGuildInform.channels[channelOptionName])
						cachedGuildInform.channels[
							channelOptionNameToDBPropery[channelOptionName]
						] = channelId;
				}
				if (successReplyArray.length !== 0) {
					await prisma.guilds.update({
						where: {
							discordId: process.env.GUILDID
						},
						data: {
							channels: cachedGuildInform.channels
						}
					});

					myCache.mySet('Guild', {
						...myCache.myGet('Guild'),
						[guildId]: cachedGuildInform
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
		}

		if (subCommandGroupName === 'add') {
			const guildCache: GuildInform = myCache.myGet('Guild')[guildId];
			const { adminRole, adminCommand, adminMember } = guildCache;

			if (subCommandName === 'admin_role') {
				const { id: roleId, name: roleName } = args.getRole('role');

				if (adminRole.includes(roleId)) {
					return interaction.reply({
						content: `\`${roleName}\` has been set an admin role.`,
						ephemeral: true
					});
				}
				await interaction.deferReply({ ephemeral: true });
				guildCache.adminRole = [...adminRole, roleId];
				await prisma.guilds.update({
					where: {
						discordId: process.env.GUILDID
					},
					data: {
						adminRole: guildCache.adminRole
					}
				});
				myCache.mySet('Guild', {
					...myCache.myGet('Guild'),
					[guildId]: guildCache
				});
				return interaction.followUp({
					content: `\`${roleName}\` has been set an admin role.`,
					ephemeral: true
				});
			}

			if (subCommandName === 'admin_member') {
				const { id: userId, username, bot } = args.getUser('member');

				if (bot) {
					return interaction.reply({
						content: 'You cannot add a bot as an admin member.',
						ephemeral: true
					});
				}
				if (adminMember.includes(userId)) {
					return interaction.reply({
						content: `\`${username}\` has been set an admin member.`,
						ephemeral: true
					});
				}
				guildCache.adminMember = [...adminMember, userId];
				await interaction.deferReply({ ephemeral: true });
				await prisma.guilds.update({
					where: {
						discordId: process.env.GUILDID
					},
					data: {
						adminMember: guildCache.adminMember
					}
				});
				myCache.mySet('Guild', {
					...myCache.myGet('Guild'),
					[guildId]: guildCache
				});
				return interaction.followUp({
					content: `\`${username}\` has been set an admin member.`,
					ephemeral: true
				});
			}
			if (subCommandName === 'admin_command') {
				const commandName = args.getString('command');

				if (adminCommand.includes(commandName)) {
					return interaction.reply({
						content: `\`${commandName}\` has been set an admin command.`,
						ephemeral: true
					});
				}
				guildCache.adminCommand = [...adminCommand, commandName];
				await interaction.deferReply({ ephemeral: true });
				await prisma.guilds.update({
					where: {
						discordId: process.env.GUILDID
					},
					data: {
						adminCommand: guildCache.adminCommand
					}
				});
				myCache.mySet('Guild', {
					...myCache.myGet('Guild'),
					[guildId]: guildCache
				});
				return interaction.followUp({
					content: `\`${commandName}\` has been set an admin command.`,
					ephemeral: true
				});
			}
		}

		if (subCommandGroupName === 'remove') {
			const guildCache: GuildInform = myCache.myGet('Guild')[guildId];
			const { adminRole, adminCommand, adminMember } = guildCache;

			if (subCommandName === 'admin_role') {
				const removeRoleId = args.getString('role');
				const filteredAdminRoleId = adminRole.filter((value) => value !== removeRoleId);

				if (filteredAdminRoleId.length === adminRole.length)
					return interaction.reply({
						content: 'Role input is invalid.',
						ephemeral: true
					});
				const targetRole = interaction.guild.roles.cache.get(removeRoleId);
				let roleName: string;

				if (targetRole) roleName = targetRole.name;
				else roleName = 'Unknown Role';
				guildCache.adminRole = filteredAdminRoleId;
				await interaction.deferReply({ ephemeral: true });
				await prisma.guilds.update({
					where: {
						discordId: process.env.GUILDID
					},
					data: {
						adminRole: filteredAdminRoleId
					}
				});
				myCache.mySet('Guild', {
					...myCache.myGet('Guild'),
					[guildId]: guildCache
				});

				return interaction.followUp({
					content: `\`${roleName}\` has been removed.`,
					ephemeral: true
				});
			}

			if (subCommandName === 'admin_member') {
				const removeMemberId = args.getString('member');
				const filteredAdminMemberId = adminMember.filter(
					(value) => value !== removeMemberId
				);

				if (filteredAdminMemberId.length === adminMember.length)
					return interaction.reply({
						content: 'Member you input is invalid.',
						ephemeral: true
					});
				const member = interaction.guild.members.cache.get(removeMemberId);
				let memberName: string;

				if (member) memberName = member.displayName;
				else memberName = 'Unknown Member';
				guildCache.adminMember = filteredAdminMemberId;
				await interaction.deferReply({ ephemeral: true });
				await prisma.guilds.update({
					where: {
						discordId: process.env.GUILDID
					},
					data: {
						adminMember: filteredAdminMemberId
					}
				});
				myCache.mySet('Guild', {
					...myCache.myGet('Guild'),
					[guildId]: guildCache
				});

				return interaction.followUp({
					content: `\`${memberName}\` has been removed.`,
					ephemeral: true
				});
			}
			if (subCommandName === 'admin_command') {
				const removeCommand = args.getString('command');
				const filteredAdminCommandName = adminCommand.filter(
					(value) => value !== removeCommand
				);

				if (filteredAdminCommandName.length === adminCommand.length)
					return interaction.reply({
						content: 'Command you input is invalid.',
						ephemeral: true
					});
				guildCache.adminCommand = filteredAdminCommandName;
				await interaction.deferReply({ ephemeral: true });
				await prisma.guilds.update({
					where: {
						discordId: process.env.GUILDID
					},
					data: {
						adminCommand: filteredAdminCommandName
					}
				});
				myCache.mySet('Guild', {
					...myCache.myGet('Guild'),
					[guildId]: guildCache
				});

				return interaction.followUp({
					content: `\`${removeCommand}\` has been removed.`,
					ephemeral: true
				});
			}
		}
	}
});
