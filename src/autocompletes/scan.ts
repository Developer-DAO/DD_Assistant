import { ApplicationCommandOptionChoiceData } from 'discord.js';
import _ from 'lodash';

import { Auto } from '../structures/AutoComplete';
import { myCache } from '../structures/Cache';
import { CommandNameEmun } from '../types/Command';
import { NUMBER } from '../utils/const';

export default new Auto({
	correspondingCommandName: CommandNameEmun.Scan,
	execute: ({ interaction }) => {
		const { name: inputName, value: inputValue } = interaction.options.getFocused(true);
		const scanResult = myCache.myGet('ChannelScan')[interaction.guild.id];
		let filter: Array<ApplicationCommandOptionChoiceData>;

		if (inputName === 'category') {
			const res = Object.keys(scanResult).map((parentId) => ({
				name: scanResult[parentId].parentName,
				value: parentId
			}));

			if (inputValue === '') return interaction.respond(res);
			filter = res
				.filter((value) => value.name.toLowerCase().includes(inputValue.toLowerCase()))
				.slice(0, NUMBER.AUTOCOMPLETE_OPTION_LENGTH);
		}

		if (inputName === 'channel') {
			const res = _.flattenDeep(
				Object.keys(scanResult).map((parentId) => {
					const channels = scanResult[parentId].channels;

					return Object.keys(channels).map((channelId) => ({
						name: `${channels[channelId].channelName} - ${channelId}`,
						value: channelId
					}));
				})
			);

			filter = res
				.filter((value) => value.name.toLowerCase().includes(inputValue.toLowerCase()))
				.slice(0, NUMBER.AUTOCOMPLETE_OPTION_LENGTH);
		}

		if (filter.length === 0) return interaction.respond([]);
		else return interaction.respond(filter);
	}
});
