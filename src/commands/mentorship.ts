import { ApplicationCommandType } from 'discord.js';

import { Command } from '../structures/Command';

export default new Command({
	name: 'mentorship',
	description: 'Mentorship helper',
	type: ApplicationCommandType.ChatInput,
	execute: ({ interaction }) => {
		return interaction.reply({
			content: 'WIP',
			ephemeral: true
		});
	}
});
