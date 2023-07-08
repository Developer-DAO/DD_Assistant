import { Message, PartialMessage } from 'discord.js';
import { ResultAsync } from 'neverthrow';

import { getPlaygroundChannel, initPlaygroundChannel } from '../commands/mentorship';
import { prisma } from '../prisma/prisma';
import { myCache } from '../structures/Cache';
import { Event } from '../structures/Event';

export default new Event('messageDelete', async (message: Message | PartialMessage) => {
	const result = getPlaygroundChannel(message.guild);

	if (result.isErr()) return;
	const guildId = message.guildId;

	return initPlaygroundChannel(result.value)
		.andThen((msg) =>
			ResultAsync.fromPromise(
				prisma.mentorship.update({
					where: {
						discordId: guildId
					},
					data: {
						playgroundChannelMsgId: msg.id
					}
				}),
				(err: Error) => err
			)
		)
		.map((newConfig) => {
			myCache.mySet('MentorshipConfig', {
				[guildId]: newConfig
			});
			return null;
		});
});
