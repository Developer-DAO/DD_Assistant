import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChannelType,
	EmbedBuilder,
	NonThreadGuildBasedChannel,
	TextChannel
} from 'discord.js';

import { myCache } from '../structures/Cache';
import { Event } from '../structures/Event';
import { createChannelHandler, getParentInform } from '../utils/util';

export default new Event('channelCreate', async (newChannel: NonThreadGuildBasedChannel) => {
	// todo handle this case in the future
	if (!myCache.myHasAll()) return;
	const guildId = newChannel.guild.id;
	const guildInformCache = myCache.myGet('Guild')[guildId];
	const { archiveCategoryChannels } = guildInformCache.channels;
	const { notificationChannel: notificationChannelId } = guildInformCache.channels;
	const notificationChannel = newChannel.guild.channels.cache.get(
		notificationChannelId
	) as TextChannel;

	if (!notificationChannel) return;
	if (
		newChannel.type === ChannelType.GuildText &&
		!newChannel.topic &&
		!archiveCategoryChannels.includes(newChannel?.parentId)
	) {
		const { parentId, parentName } = getParentInform(newChannel.parentId, newChannel.parent);

		await createChannelHandler(newChannel, parentId, parentName, guildId);

		return notificationChannel.send({
			embeds: [
				new EmbedBuilder().setTitle('Channal Report').addFields([
					{ name: 'Parent', value: `${parentName} (${parentId})` },
					{ name: 'Channel', value: `<#${newChannel.id}>` },
					{ name: 'Action', value: 'Creation' }
				])
			],
			components: [
				new ActionRowBuilder<ButtonBuilder>().addComponents([
					new ButtonBuilder()
						.setCustomId('send')
						.setLabel('Send Notification Message')
						.setEmoji('📨')
						.setStyle(ButtonStyle.Primary),
					new ButtonBuilder()
						.setCustomId('delete')
						.setLabel('Delete this record')
						.setEmoji('❌')
						.setStyle(ButtonStyle.Secondary)
				])
			]
		});
	}
});
