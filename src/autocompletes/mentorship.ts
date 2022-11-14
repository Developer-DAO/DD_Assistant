import { Auto } from '../structures/AutoComplete';

export default new Auto({
	correspondingCommandName: 'mentorship',
	execute: ({ interaction }) => {
		return interaction.respond([]);
	}
});
