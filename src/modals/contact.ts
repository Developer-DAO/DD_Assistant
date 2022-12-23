import { prisma } from '../prisma/prisma';
import { myCache } from '../structures/Cache';
import { Modal } from '../structures/Modal';

export default new Modal({
	customId: 'contact',
	execute: async ({ interaction }) => {
		const title = interaction.fields.getTextInputValue('title').trim();
		const description = interaction.fields.getTextInputValue('description').trim();
		const cache = myCache.myGet('ContactModalCache')[interaction.user.id];

		if (!cache) {
			return interaction.reply({
				content: 'Sorry, cache error.',
				ephemeral: true
			});
		}
		const targetUserId = cache.id;

		await interaction.deferReply({ ephemeral: true });
		await prisma.contact.upsert({
			where: {
				id: targetUserId
			},
			update: {
				description,
				title
			},
			create: {
				id: targetUserId,
				description,
				title,
				discordId: interaction.guildId
			}
		});

		return interaction.followUp({
			content: `You have successfully created this point of contact.`
		});
	}
});
