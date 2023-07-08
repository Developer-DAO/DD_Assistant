import { Mentee, Mentor } from '@prisma/client';

import { prisma } from '../prisma/prisma';
import { Auto } from '../structures/AutoComplete';
import { CommandNameEmun } from '../types/Command';

export default new Auto({
	correspondingCommandName: CommandNameEmun.Mentorship,
	execute: async ({ interaction }) => {
		const { value: inputValue } = interaction.options.getFocused(true);
		const subCommandName = interaction.options.getSubcommand();

		// Use subcommandName to discriminate mentor or mentee
		const mentorOrMentee =
			subCommandName === 'mentor'
				? await prisma.mentor.findMany({
						where: {
							discordId: interaction.guildId
						}
				  })
				: await prisma.mentee.findMany({
						where: {
							discordId: interaction.guildId
						}
				  });

		if (!mentorOrMentee || mentorOrMentee.length === 0) {
			return interaction.respond([]);
		}

		return interaction.respond(
			mentorOrMentee
				.map((value: Mentor | Mentee) => ({
					name: value.name,
					value: value.id
				}))
				.filter((value) => value.name.toLowerCase().includes(inputValue.toLowerCase()))
		);
	}
});
