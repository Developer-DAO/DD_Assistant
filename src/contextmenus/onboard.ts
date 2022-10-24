import { ApplicationCommandType } from 'discord.js';

import { MessageContextMenu } from '../structures/ContextMenu';
import { fetchOnboardingSchedule, searchEvent } from '../utils/util';

export default new MessageContextMenu({
	name: 'Grab onboarding call',
	type: ApplicationCommandType.Message,
	execute: async ({ interaction }) => {
		const { targetMessage, guildId } = interaction;
		const { embeds } = targetMessage;

		if (embeds.length === 0) {
			return interaction.reply({
				content: 'The message you chose is invalid, please check it again.',
				ephemeral: true
			});
		}
		const seshEmbed = embeds[0]?.toJSON();

		if (!seshEmbed) {
			return interaction.reply({
				content: 'The message you chose is invalid, please check it again.',
				ephemeral: true
			});
		}
		await interaction.deferReply({ ephemeral: true });
		const searchResult = await searchEvent(seshEmbed.fields, guildId);

		if (searchResult) {
			return interaction.followUp({
				content: searchResult
			});
		}
		const onboardingEmbeds = await fetchOnboardingSchedule(guildId);

		return interaction.followUp({
			content: 'Onboarding call schedule has been updated.',
			embeds: [onboardingEmbeds],
			ephemeral: true
		});
	}
});
