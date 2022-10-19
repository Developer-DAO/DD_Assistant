import {
	ActionRowBuilder,
	ApplicationCommandOptionType,
	ButtonBuilder,
	ButtonStyle,
	CategoryChannel,
	ChannelType,
	ComponentType,
	EmbedBuilder,
	TextChannel
} from 'discord.js';

import { prisma } from '../prisma/prisma';
import { myCache } from '../structures/Cache';
import { Command } from '../structures/Command';
import { awaitWrapSendRequestReturnValue } from '../types/Util';
import { NUMBER } from '../utils/const';
import {
	autoArchive,
	awaitWrap,
	awaitWrapSendRequest,
	checkChannelPermission,
	deSerializeChannelScan,
	embedFieldsFactory,
	getNotificationMsg,
	scanChannel
} from '../utils/util';

export default new Command({
	name: 'scan',
	description: 'Channel Management',
	options: [
		{
			type: ApplicationCommandOptionType.Subcommand,
			name: 'view',
			description: 'Check current channel status',
			options: [
				{
					type: ApplicationCommandOptionType.String,
					name: 'category',
					description: 'Read channel status of a specific category channel',
					autocomplete: true
				}
			]
		},
		{
			type: ApplicationCommandOptionType.Subcommand,
			name: 'init',
			description: 'Initiate channel scan'
		},
		{
			type: ApplicationCommandOptionType.Subcommand,
			name: 'broadcast',
			description: 'Broadcast predefined messages to channels'
		},
		{
			type: ApplicationCommandOptionType.Subcommand,
			name: 'send',
			description: 'Send predefiend messages to this channel and update channel status',
			options: [
				{
					type: ApplicationCommandOptionType.Channel,
					name: 'channel',
					description: 'Choose a text channel',
					channelTypes: [ChannelType.GuildText],
					required: true
				}
			]
		},
		{
			type: ApplicationCommandOptionType.Subcommand,
			name: 'archive',
			description: 'Archive all channels'
		},
		{
			type: ApplicationCommandOptionType.Subcommand,
			name: 'delete',
			description: 'Delete channels under a category channel',
			options: [
				{
					type: ApplicationCommandOptionType.Channel,
					name: 'channel',
					description: 'Choose a category channel to be deleted',
					channelTypes: [ChannelType.GuildCategory],
					required: true
				}
			]
		}
	],
	execute: async ({ interaction, args }) => {
		const guildId = interaction.guild.id;
		const subcommandName = args.getSubcommand();
		const { commandId } = interaction;
		const statusLockCache = myCache.myGet('StatusLock');
		const guildStatusLockCache = statusLockCache[guildId];
		const { scanStatus, archiveStatus, broadcastStatus } = statusLockCache[guildId];

		if (subcommandName === 'init') {
			if (scanStatus) {
				return interaction.reply({
					content: 'Sorry, scan is going on, please wait for a while',
					ephemeral: true
				});
			}
			// todo optimize this part
			myCache.mySet('StatusLock', {
				...statusLockCache,
				[guildId]: {
					...guildStatusLockCache,
					scanStatus: true
				}
			});
			// todo keep previous context
			await interaction.reply({
				content:
					'It may take 1-2 mins to complete the scan. Please come back and check later.',
				ephemeral: true
			});

			const archiveChannels = myCache.myGet('Guild')[guildId].archiveCategoryChannels;
			const scanResult = await scanChannel(interaction.guild, archiveChannels);
			const channelScanCache = {
				[guildId]: scanResult
			};

			await prisma.channelScan.update({
				where: {
					discordId: guildId
				},
				data: {
					categories: deSerializeChannelScan(channelScanCache, guildId).categories
				}
			});
			myCache.mySet('ChannelScan', channelScanCache);
			myCache.mySet('StatusLock', {
				...statusLockCache,
				[guildId]: {
					...guildStatusLockCache,
					scanStatus: false
				}
			});
			return interaction.editReply({
				content: `Channel Scan is completed, use </scan view:${commandId}> to check results`
			});
		}

		if (subcommandName === 'view') {
			const categoryChannelId = args.getString('category');

			if (categoryChannelId) {
				const result = myCache.myGet('ChannelScan')[guildId][categoryChannelId];

				if (!result)
					return interaction.reply({
						content: 'I cannot fetch the scan result of the channel you inputed.',
						ephemeral: true
					});
				const { channelFields, lastMsgTimeFields, statusFields } = embedFieldsFactory(
					result.channels,
					guildId
				);

				return interaction.reply({
					embeds: channelFields.map((value, index) =>
						new EmbedBuilder()
							.setTitle(`Channel Category: ${result.parentName}`)
							.addFields([
								{ name: '📣 Channel', value: value, inline: true },
								{
									name: '📨 Last Message',
									value: lastMsgTimeFields[index],
									inline: true
								},
								{ name: '⚙️ Status', value: statusFields[index], inline: true }
							])
					)
				});
			}

			await interaction.deferReply({ ephemeral: true });
			const scanResult = myCache.myGet('ChannelScan')[guildId];

			if (!scanResult && Object.keys(scanResult).length === 0) {
				return interaction.followUp({
					content: `Please use </scan view:${commandId}> to init channel scan.`
				});
			}

			let embedContentArray: EmbedBuilder[][];
			let pageIndex = 1;

			Object.keys(scanResult).forEach((parentId) => {
				const { channels, parentName } = scanResult[parentId];
				const embedTitle = `Channel Category: ${parentName}`;
				const { channelFields, lastMsgTimeFields, statusFields } = embedFieldsFactory(
					channels,
					guildId
				);

				embedContentArray = [
					...embedContentArray,
					...channelFields.map((value, index) => [
						new EmbedBuilder()
							.setTitle(embedTitle)
							.addFields([
								{ name: '📣 Channel', value: value, inline: true },
								{
									name: '📨 Last Message',
									value: lastMsgTimeFields[index],
									inline: true
								},
								{ name: '⚙️ Status', value: statusFields[index], inline: true }
							])
							.setFooter({ text: `Group ${pageIndex++}` })
					])
				];
			});

			const buttonGenerator = (index: number) => {
				return [
					new ActionRowBuilder<ButtonBuilder>().addComponents([
						new ButtonBuilder()
							.setCustomId('first')
							.setLabel('First Page')
							.setEmoji('⏮️')
							.setStyle(ButtonStyle.Primary)
							.setDisabled(index === 0),
						new ButtonBuilder()
							.setCustomId('previous')
							.setEmoji('⬅️')
							.setStyle(ButtonStyle.Secondary)
							.setDisabled(index === 0),
						new ButtonBuilder()
							.setCustomId('next')
							.setEmoji('➡️')
							.setStyle(ButtonStyle.Secondary)
							.setDisabled(index === embedContentArray.length - 1),
						new ButtonBuilder()
							.setCustomId('last')
							.setLabel('Last Page')
							.setEmoji('⏭️')
							.setStyle(ButtonStyle.Primary)
							.setDisabled(index === embedContentArray.length - 1),
						new ButtonBuilder()
							.setLabel(`Expired in ${NUMBER.SCAN_VIEW_DURATION / 60000}`)
							.setStyle(ButtonStyle.Link)
							.setDisabled(true)
					])
				];
			};
			let page = 0;
			const msg = await interaction.followUp({
				embeds: embedContentArray[page],
				components: buttonGenerator(page)
			});

			const collector = msg.createMessageComponentCollector({
				time: NUMBER.SCAN_VIEW_DURATION,
				componentType: ComponentType.Button
			});

			collector.on('collect', async (btnInteraction) => {
				switch (btnInteraction.customId) {
					case 'next':
						page++;
						break;
					case 'previous':
						page--;
						break;
					case 'first':
						page = 0;
						break;
					case 'last':
						page = embedContentArray.length - 1;
				}

				await interaction.editReply({
					embeds: embedContentArray[page],
					components: buttonGenerator(page)
				});
				btnInteraction.deferUpdate();
				return;
			});

			collector.on('end', async (collected) => {
				await interaction.editReply({
					content: 'Time Out, please run it again'
				});
			});
			return;
		}

		if (subcommandName === 'delete') {
			const targetCategoryChannel = args.getChannel('channel') as CategoryChannel;

			if (targetCategoryChannel.children.cache.size === 0) {
				targetCategoryChannel.delete();
				return interaction.reply({
					content: `Category Channel \`${targetCategoryChannel.name}\` has been deleted`,
					ephemeral: true
				});
			}

			// to-do what happens when deleting the category channel first before deleting channels under it
			await interaction.deferReply({ ephemeral: true });
			const undeletableChannelIds = [];
			const deletePromise = targetCategoryChannel.children.cache
				.filter((channelObj) => {
					if (channelObj.deletable) return true;
					else {
						undeletableChannelIds.push(channelObj.id);
						return false;
					}
				})
				.map((channelObj) => channelObj.delete());

			Promise.all(deletePromise);

			if (targetCategoryChannel.deletable) {
				targetCategoryChannel.delete();
			}

			return interaction.followUp({
				content: 'Delete Completed.'
			});
		}

		if (subcommandName === 'archive') {
			if (archiveStatus) {
				return interaction.reply({
					content: 'Sorry, archive is going on, please wait for a while',
					ephemeral: true
				});
			}
			myCache.mySet('StatusLock', {
				...statusLockCache,
				[guildId]: {
					...guildStatusLockCache,
					archiveStatus: true
				}
			});
			await interaction.deferReply({ ephemeral: true });
			const { error, errorMessage, embeds } = await autoArchive(
				interaction.guild.channels,
				guildId,
				interaction.guild.members.me.id
			);

			myCache.mySet('StatusLock', {
				...statusLockCache,
				[guildId]: {
					...guildStatusLockCache,
					archiveStatus: true
				}
			});
			if (error) {
				return interaction.followUp({
					content: errorMessage
				});
			} else {
				const notificationChannel = interaction.guild.channels.cache.get(
					myCache.myGet('Guild')[guildId].channels.notificationChannel
				) as TextChannel;

				notificationChannel.send({
					embeds: embeds
				});
				return interaction.followUp({
					content: `Archive results have been sent to ${notificationChannel.id}.`
				});
			}
		}

		if (subcommandName === 'broadcast') {
			if (broadcastStatus) {
				return interaction.reply({
					content: 'Sorry, broadcast is going on, please wait for a while',
					ephemeral: true
				});
			}
			myCache.mySet('StatusLock', {
				...statusLockCache,
				[guildId]: {
					...guildStatusLockCache,
					broadcastStatus: true
				}
			});
			await interaction.deferReply({ ephemeral: true });
			const botId = interaction.guild.members.me.id;
			const sendMsgRequestArray: Array<Promise<awaitWrapSendRequestReturnValue>> = [];
			const unfetchableChannelNameArray: Array<string> = [];
			const failSendMsgChannelIdArray: Array<string> = [];
			const scanResult = myCache.myGet('ChannelScan')[guildId];
			const broadcastResult: {
				[channelId: string]: {
					messageId: string;
					timestamp: string;
				};
			} = {};

			for (const parentId of Object.keys(scanResult)) {
				const channels = scanResult[parentId];

				for (const channelId of Object.keys(channels.channels)) {
					const channel = interaction.guild.channels.cache.get(channelId) as TextChannel;

					broadcastResult[channelId] = {
						messageId: '',
						timestamp: ''
					};
					if (!channel) {
						unfetchableChannelNameArray.push(channels[channelId].channelName);
					} else {
						const permissionCheckingResult = checkChannelPermission(channel, botId);

						if (permissionCheckingResult) {
							failSendMsgChannelIdArray.push(channelId);
						} else {
							sendMsgRequestArray.push(
								awaitWrapSendRequest(
									channel.send({
										content: getNotificationMsg(
											channel.id,
											Math.floor(new Date().getTime() / 1000) +
												NUMBER.ARCHIVE_EXPIRY_TIME
										)
									}),
									channelId
								)
							);
						}
					}
				}
			}

			const { result, error } = await awaitWrap(Promise.all(sendMsgRequestArray));

			if (error) {
				myCache.mySet('StatusLock', {
					...statusLockCache,
					[guildId]: {
						...guildStatusLockCache,
						broadcastStatus: false
					}
				});
				return interaction.followUp({
					content: `Broadcast failed, error occured: \`${error}\``
				});
			}

			result.forEach((value) => {
				if (value.error) {
					failSendMsgChannelIdArray.push(value.channelId);
				} else
					broadcastResult[value.channelId] = {
						messageId: value.messageId,
						timestamp: value.createTimestamp
					};
			});

			const failSendMsgChannelContent =
				failSendMsgChannelIdArray.reduce((pre, cur) => {
					return pre + `> <#${cur}>\n`;
				}, '') ?? '> -';
			const unfetchableChannelNameContent =
				unfetchableChannelNameArray.reduce((pre, cur) => {
					return pre + `> \`${cur}\`\n`;
				}, '') ?? '> -';

			Object.keys(scanResult).forEach((parentId) => {
				const channels = scanResult[parentId].channels;

				Object.keys(channels).forEach((channelId) => {
					const { messageId, timestamp } = broadcastResult[channelId];

					if (messageId) {
						scanResult[parentId].channels[channelId] = {
							channelName: scanResult[parentId].channels[channelId].channelName,
							status: true,
							messageId: messageId,
							archiveTimestamp: timestamp + NUMBER.ARCHIVE_EXPIRY_TIME,
							lastMsgTimestamp: timestamp
						};
					}
				});
			});
			prisma.channelScan.update({
				where: {
					discordId: guildId
				},
				data: {
					categories: scanResult
				}
			});
			myCache.mySet('ChannelScan', {
				...myCache.myGet('ChannelScan'),
				[guildId]: scanResult
			});
			myCache.mySet('StatusLock', {
				...statusLockCache,
				[guildId]: {
					...guildStatusLockCache,
					broadcastStatus: false
				}
			});

			return interaction.followUp({
				embeds: [
					new EmbedBuilder()
						.setTitle('📣 Broadcast Report')
						.setDescription(
							'**Unfetchable**: The bot cannot fetch information of these channels.\n\n**Unsendable**: The bot cannot send messages to these channels with an unknown reason.'
						)
						.addFields([
							{
								name: 'Unfetchable Channel',
								value: unfetchableChannelNameContent,
								inline: true
							},
							{
								name: 'Fail to send',
								value: failSendMsgChannelContent,
								inline: true
							}
						])
				],
				content: `Broadcast is done, please run </scan view: ${commandId}> again to view results`
			});
		}
	}
});
