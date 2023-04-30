import { Message, TextChannel } from 'discord.js';

import { prisma } from '../prisma/prisma';
import { myCache } from '../structures/Cache';
import { Event } from '../structures/Event';
import { StickyMsgTypeToMsg } from '../utils/const';
import { awaitWrap, checkTextChannelPermissionForStickyMsg } from '../utils/util';

export default new Event('messageCreate', async (message: Message) => {
	if (message.author.bot) return;
	if (!myCache.myHasAll()) return;
	const { guild, channelId } = message;
	const channel = message.channel as TextChannel;
	const botId = guild.members.me.id;

	const stickyRecords = myCache.myGet('StickyInform');

	if (stickyRecords[channelId]) {
		if (checkTextChannelPermissionForStickyMsg(channel, botId)) return;
		const { messageId, messageType } = stickyRecords[channelId];

		const { result: message } = await awaitWrap(channel.messages.fetch(messageId));

		if (message) {
			await message.delete();
		}
		const { id } = await channel.send(StickyMsgTypeToMsg[messageType]);

		stickyRecords[channelId].messageId = id;
		await prisma.stickyRecord.update({
			where: {
				channelId
			},
			data: {
				messageId: id
			}
		});
		myCache.mySet('StickyInform', stickyRecords);
	}
});
