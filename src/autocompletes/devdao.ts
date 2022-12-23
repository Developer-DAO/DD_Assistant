import { Auto } from '../structures/AutoComplete';
import { CommandNameEmun } from '../types/Command';
import { DOCS, NUMBER } from '../utils/const';

export default new Auto({
	correspondingCommandName: CommandNameEmun.Devdao,
	execute: ({ interaction }) => {
		const { value: inputValue } = interaction.options.getFocused(true);

		const res = Object.keys(DOCS).map((key) => ({
			name: DOCS[key]['index'],
			value: key
		}));

		if (inputValue === '') return interaction.respond(res);
		const filter = res
			.filter((value) => value.name.toLowerCase().includes(inputValue.toLowerCase()))
			.slice(0, NUMBER.AUTOCOMPLETE_OPTION_LENGTH);

		if (filter.length === 0) return interaction.respond([]);
		else return interaction.respond(filter);
	}
});
