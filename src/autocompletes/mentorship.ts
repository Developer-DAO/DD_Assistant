import { Auto } from '../structures/AutoComplete';
import { CommandNameEmun } from '../types/Command';

export default new Auto({
	correspondingCommandName: CommandNameEmun.Mentorship,
	execute: ({ interaction }) => {
		return interaction.respond([]);
	}
});
