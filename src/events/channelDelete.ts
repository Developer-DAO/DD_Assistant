import {
	ChannelType,
	DMChannel,
	EmbedBuilder,
	NonThreadGuildBasedChannel,
	TextChannel
} from 'discord.js';

import { myCache } from '../structures/Cache';
import { Event } from '../structures/Event';
import { deleteChannelHandler, getParentInform } from '../utils/util';

export default new Event(
	'channelDelete',
	async (deletedChannel: NonThreadGuildBasedChannel | DMChannel) => {
		// todo handle this case in the future
		if (!myCache.myHasAll()) return
		if (deletedChannel.type === ChannelType.DM) return;

		const guildId = deletedChannel.guild.id;
		const guildInformCache = myCache.myGet('Guild')[guildId];
		const { notificationChannel: notificationChannelId } = guildInformCache.channels;
		const notificationChannel = deletedChannel.guild.channels.cache.get(
			notificationChannelId
		) as TextChannel;

		if (!notificationChannel) return;
		const { parentId, parentName } = getParentInform(
			deletedChannel.parentId,
			deletedChannel.parent
		);

		await deleteChannelHandler(deletedChannel, parentId, guildId);

		return notificationChannel.send({
			embeds: [
				new EmbedBuilder().setTitle('Channal Report').addFields([
					{ name: 'Parent', value: `${parentName} (${parentId})` },
					{ name: 'Channel', value: `\`${deletedChannel.name}\`` },
					{ name: 'Action', value: 'Delete' }
				])
			]
		});
	}
);
