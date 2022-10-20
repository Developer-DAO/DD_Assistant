import { Auto } from '../structures/AutoComplete';
import { myCache } from '../structures/Cache';

export default new Auto({
	correspondingCommandName: 'scan',
	execute: ({ interaction }) => {
		const { value: inputValue } = interaction.options.getFocused(true);
		const scanResult = myCache.myGet('ChannelScan')[interaction.guild.id];

		const res = Object.keys(scanResult).map((parentId) => ({
			name: scanResult[parentId].parentName,
			value: parentId
		}));

		if (inputValue === '') return interaction.respond(res);
		const filter = res.filter((value) =>
			value.name.toLowerCase().includes(inputValue.toLowerCase())
		);

		if (filter.length === 0) return interaction.respond([]);
		else return interaction.respond(filter);
	}
});
