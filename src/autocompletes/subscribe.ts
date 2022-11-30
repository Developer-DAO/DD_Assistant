import { ApplicationCommandOptionChoiceData } from 'discord.js';

import { Auto } from '../structures/AutoComplete';
import { myCache } from '../structures/Cache';

export default new Auto({
	correspondingCommandName: 'hashnode_unsub',
	execute: ({ interaction }) => {
		const { value: inputValue } = interaction.options.getFocused(true);
		const cache = myCache.myGet('HashNodeSub');

		const filter: Array<ApplicationCommandOptionChoiceData> = Object.keys(cache)
			.filter((username) => username.toLowerCase().includes(inputValue.toLowerCase()))
			.map((username) => ({
				name: username,
				value: username
			}));

		if (filter.length === 0) return interaction.respond([]);
		else return interaction.respond(filter);
	}
});
