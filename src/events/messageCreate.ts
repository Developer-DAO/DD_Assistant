import { Message, TextChannel } from 'discord.js';

import { myCache } from '../structures/Cache';
import { Event } from '../structures/Event';
import { stickyMsgHandler } from '../utils/util';

export default new Event('messageCreate', async (message: Message) => {
	if (message.author.bot) return;
	if (!myCache.myHasAll()) return;
	if (message.guild) {
		const { author, guild } = message;
		const channel = message.channel as TextChannel;
		const guildId = guild.id;
		const botId = guild.members.me.id;
		const guildInform = myCache.myGet('Guild')[guildId];

		if (
			author.id !== botId &&
			(guildInform.channels.womenIntroductionChannel === channel.id ||
				guildInform.channels.introductionChannel === channel.id)
		) {
			stickyMsgHandler(channel, botId);
		}
	}
});
