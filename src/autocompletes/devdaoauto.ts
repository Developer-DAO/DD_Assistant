import { Auto } from '../structures/AutoComplete';
import { DOCS } from '../utils/const';

export default new Auto({
	correspondingCommandName: 'devdao',
	execute: ({ interaction }) => {
		const { value: inputValue } = interaction.options.getFocused(true);
		const res = Object.keys(DOCS).map((key) => ({
			name: DOCS[key]['index'],
			value: key
		}));
		if (inputValue === '') return interaction.respond(res);
		const filter = res.filter((value) =>
			value.name.toLowerCase().includes(inputValue.toLowerCase())
		);
		if (filter.length === 0) return interaction.respond([]);
		else return interaction.respond(filter);
	}
});
