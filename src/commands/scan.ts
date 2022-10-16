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
import { NUMBER } from '../utils/const';
import { deSerializeChannelScan, embedFieldsFactory, scanChannel } from '../utils/util';

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
		const guilId = interaction.guild.id;
		const subcommandName = args.getSubcommand();

		if (subcommandName === 'init') {
			// todo keep previous context
			await interaction.reply({
				content:
					'It may take 1-2 mins to complete the scan. Please come back and check later.',
				ephemeral: true
			});

			const archiveChannels = myCache.myGet('Guild')[guilId].archiveCategoryChannels;
			const scanResult = await scanChannel(interaction.guild, archiveChannels);
			const channelScanCache = {
				[guilId]: scanResult
			};

			await prisma.channelScan.update({
				where: {
					discordId: guilId
				},
				data: {
					categories: deSerializeChannelScan(channelScanCache, guilId).categories
				}
			});
			myCache.mySet('ChannelScan', channelScanCache);

			return interaction.editReply({
				content: `Channel Scan is completed, use </scan view:${interaction.command.id}> to check results`
			});
		}

		if (subcommandName === 'view') {
			const categoryChannelId = args.getString('category');

			if (categoryChannelId) {
				const result = myCache.myGet('ChannelScan')[guilId][categoryChannelId];

				if (!result)
					return interaction.reply({
						content: 'I cannot fetch the scan result of the channel you inputed.',
						ephemeral: true
					});
				const { channelFields, lastMsgTimeFields, statusFields } = embedFieldsFactory(
					result.channels,
					guilId
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
			const scanResult = myCache.myGet('ChannelScan')[guilId];

			if (!scanResult && Object.keys(scanResult).length === 0) {
				return interaction.followUp({
					content: `Please use </scan view:${interaction.command.id}> to init channel scan.`
				});
			}

			let embedContentArray: EmbedBuilder[][];
			let pageIndex = 1;

			Object.keys(scanResult).forEach((parentId) => {
				const { channels, parentName } = scanResult[parentId];
				const embedTitle = `Channel Category: ${parentName}`;
				const { channelFields, lastMsgTimeFields, statusFields } = embedFieldsFactory(
					channels,
					guilId
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
			// to-do archive channel permission checking
			// to-do auto archive
			// to-do using archive_status to auto archive
			const { notificationChannel } = myCache.myGet('Guild')[guilId].channels;
			const { archiveCategoryChannels, archiveChannels } = myCache.myGet('Guild')[guilId];

			if (!notificationChannel) {
				return interaction.reply({
					content: 'Please set up a notification channel first',
					ephemeral: true
				});
			}
			const guildChannelManager = interaction.guild.channels;
			let scanResult = myCache.myGet('ChannelScan')[guilId];
			const current = Math.floor(new Date().getTime() / 1000);
			const toBeArchived: Array<TextChannel> = [];

			Object.keys(scanResult).forEach((parentId) => {
				const {channels} = scanResult[parentId];

                toBeArchived.push(
                    ...Object.keys(channels).filter((channelId) => {
                        
                    })
                )
			});
			for (const parentId in scanResult) {
				const channels = scanResult[parentId];

				toBeArchived.push(
					...Object.keys(channels)
						.filter((channelId) => {
							if (channelId == 'parentName') return false;
							if (
								channels[channelId].timestamp != 0 &&
								current > channels[channelId].timestamp
							)
								return true;
							else return false;
						})
						.map((channelId) => ({
							parentId: parentId,
							channelId: channelId
						}))
				);
			}
			if (toBeArchived.length == 0)
				return interaction.reply({
					content: 'No channel needs to be archived.',
					ephemeral: true
				});

			const length = toBeArchived.length;
			const notificationChannel = guildChannelManager.cache.get(notification_channel);
			const limit = CONSTANT.BOT_NUMERICAL_VALUE.ARCHIVE_CHANNEL_CHILD_LIMIT;
			let counter = 0;
			const failChannels = [];
			const successChannels = [];

			await interaction.deferReply({ ephemeral: true });
			while (true) {
				const archiveChanneJSON = _.last(archive_channels);
				let remainingSpace;
				let targetArchieveChannelId;

				if (!archiveChanneJSON || archiveChanneJSON.remaining == 0) {
					const archiveChannel = await guildChannelManager.create(
						sprintf(
							CONSTANT.CONTENT.ARCHIVE_CHANNEL_NAME_TEMPLATE,
							archive_channels.length + 1
						),
						{
							type: 'GUILD_CATEGORY',
							permissionOverwrites: [
								{
									id: interaction.guild.id,
									deny: [PermissionFlagsBits.ViewChannel]
								}
								// to-do deny dev to view this channel
							]
						}
					);

					archive_channels.push({
						id: archiveChannel.id,
						remaining: limit
					});
					targetArchieveChannelId = archiveChannel.id;
					remainingSpace = limit;
				} else {
					targetArchieveChannelId = archiveChanneJSON.id;
					remainingSpace = archiveChanneJSON.remaining;
				}
				let moveCounter = 0;

				for (const { parentId, channelId } of toBeArchived.slice(
					counter,
					counter + remainingSpace
				)) {
					const channel = guildChannelManager.cache.get(channelId);

					if (!channel)
						return failChannels.push({
							parentId: parentId,
							channelId: channelId
						});

					const { result, error } = await awaitWrap(
						channel.setParent(targetArchieveChannelId, {
							lockPermissions: true,
							reason: 'Inactive Channel'
						})
					);

					if (error)
						return failChannels.push({
							parentId: parentId,
							channelId: channelId
						});

					successChannels.push({
						parentId: parentId,
						channelId: channelId,
						currentParentId: targetArchieveChannelId
					});
					moveCounter++;
				}
				archive_channels.splice(archive_channels.length - 1, 1, {
					id: targetArchieveChannelId,
					remaining: remainingSpace - moveCounter
				});
				if (counter + remainingSpace > length) break;
				counter += remainingSpace;
			}

			const toBeCachedArchiveCategoryChannel = _.uniq([
				...archive_category_channel,
				...archive_channels.map(({ id }) => id)
			]);

			await updateDb('archive_channels', archive_channels);
			await updateDb('archive_category_channel', toBeCachedArchiveCategoryChannel);
			myCache.set('GuildSetting', {
				...myCache.get('GuildSetting'),
				archive_channels: archive_channels,
				archive_category_channel: toBeCachedArchiveCategoryChannel
			});

			scanResult = myCache.get('ChannelsWithoutTopic');
			successChannels.forEach(({ parentId, channelId }) => {
				delete scanResult[parentId][channelId];
				// Only 'parentName' attribute
				if (Object.keys(scanResult[parentId]).length == 1) {
					delete scanResult[parentId];
				}
			});
			await updateDb('channelsWithoutTopic', scanResult);
			myCache.set('ChannelsWithoutTopic', scanResult);

			let failChannelsField = '> -';
			let failChannelsParentsField = '> -';
			let successChannelsField = '> -';
			let successChannelsParentsField = '> -';
			let successChannelsPreviousParentsField = '> -';

			successChannels.forEach(({ parentId, channelId, currentParentId }, index) => {
				if (index == 0) {
					successChannelsField = '';
					successChannelsParentsField = '';
					successChannelsPreviousParentsField = '';
				}
				successChannelsField += `<#${channelId}>\n`;
				successChannelsParentsField += `<#${currentParentId}>\n`;
				successChannelsPreviousParentsField += `<#${parentId}>\n`;
			});
			failChannels.forEach(({ parentId, channelId }, index) => {
				if (index == 0) {
					failChannelsField = '';
					failChannelsParentsField = '';
				}
				failChannelsField += `<#${channelId}>\n`;
				failChannelsParentsField += `<#${parentId}>\n`;
			});
			// to-do consider the bytes exceeding the limit partition needed
			await notificationChannel.send({
				embeds: [
					new MessageEmbed().setTitle('Archive Success Report').addFields([
						{ name: 'Channel', value: successChannelsField, inline: true },
						{
							name: 'Current Parent',
							value: successChannelsParentsField,
							inline: true
						},
						{
							name: 'Previous Parent',
							value: successChannelsPreviousParentsField,
							inline: true
						}
					]),
					new MessageEmbed().setTitle('Archive Fail Report').addFields([
						{ name: 'Channel', value: failChannelsField, inline: true },
						{ name: 'Current Parent', value: failChannelsParentsField, inline: true }
					])
				]
			});
			return interaction.followUp({
				content: `Done, results has been sent to <#${notification_channel}>`
			});
		}
	}
});
