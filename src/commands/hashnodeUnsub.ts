import { ApplicationCommandOptionType, ApplicationCommandType } from 'discord.js';

import { prisma } from '../prisma/prisma';
import { myCache } from '../structures/Cache';
import { Command } from '../structures/Command';
import { CommandNameEmun } from '../types/Command';

export default new Command({
	name: CommandNameEmun.Hashnode_unsub,
	description: 'Unsubscribe a user of HashNode.',
	type: ApplicationCommandType.ChatInput,
	options: [
		{
			name: 'username',
			type: ApplicationCommandOptionType.String,
			required: true,
			description: 'Which user you would to unsubscribe',
			autocomplete: true
		}
	],
	execute: async ({ interaction, args }) => {
		const username = args.getString('username');
		const cache = myCache.myGet('HashNodeSub');

		if (!cache[username]) {
			return interaction.reply({
				content: `Sorry, \`${username}\` does not exist in the database.`,
				ephemeral: true
			});
		}

		await interaction.deferReply({ ephemeral: true });
		await prisma.hashNodeSub.delete({
			where: {
				id: cache[username].id
			}
		});
		delete cache[username];
		myCache.mySet('HashNodeSub', cache);

		return interaction.followUp({
			content: `\`${username}\` has been deleted successfully.`
		});
	}
});
