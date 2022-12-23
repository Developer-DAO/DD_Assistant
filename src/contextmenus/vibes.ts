import { ApplicationCommandType } from 'discord.js';

import { MessageContextMenu } from '../structures/ContextMenu';
import { ContextMenuNameEnum } from '../types/ContextMenu';
import { CallType } from '../types/Util';
import { fetchCallSchedule, searchEvent } from '../utils/util';

export default new MessageContextMenu({
	name: ContextMenuNameEnum.GrabVibesCall,
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
		const searchResult = await searchEvent(seshEmbed.fields, guildId, CallType.WOMENVIBES);

		if (searchResult) {
			return interaction.followUp({
				content: searchResult
			});
		}
		const womenVibesEmbeds = await fetchCallSchedule(guildId, CallType.WOMENVIBES);

		return interaction.followUp({
			content: 'Women vibes call schedule has been updated.',
			embeds: [womenVibesEmbeds],
			ephemeral: true
		});
	}
});
