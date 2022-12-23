import { Auto } from '../structures/AutoComplete';
import { CommandNameEmun } from '../types/Command';
import { EMPTYSTRING, NUMBER, TIMEZONELIST } from '../utils/const';

export default new Auto({
	correspondingCommandName: CommandNameEmun.Birthday,
	execute: ({ interaction }) => {
		const { value } = interaction.options.getFocused(true);

		if (!value || value.length < 3) {
			return interaction.respond([
				{
					name: 'Please input at least three chars to activate the search',
					value: EMPTYSTRING
				}
			]);
		}

		const filter = TIMEZONELIST.filter((timezoneName) =>
			timezoneName.toLowerCase().includes(value.toLowerCase())
		)
			.map((timezoneName) => ({
				name: timezoneName,
				value: timezoneName
			}))
			.slice(0, NUMBER.AUTOCOMPLETE_OPTION_LENGTH);

		if (filter.length === 0) {
			return interaction.respond([
				{
					name: 'Please check your input, I cannot find this city',
					value: EMPTYSTRING
				}
			]);
		} else {
			interaction.respond(filter);
		}
	}
});
