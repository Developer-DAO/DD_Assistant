import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { sprintf } from 'sprintf-js';

import { Button } from '../structures/Button';
import { myCache } from '../structures/Cache';
import { defaultVoiceContext, LINK } from '../utils/const';
import { getCurrentTimeMin } from '../utils/util';

export default new Button({
	customIds: ['end'],
	execute: async ({ interaction }) => {
		const guildId = interaction.guild.id;
		const { hostId, attendees, duration } = myCache.myGet('VoiceContext')[guildId];

		if (interaction.user.id !== hostId)
			return interaction.reply({
				content: 'Sorry, only the host can end this event.',
				ephemeral: true
			});

		const current = getCurrentTimeMin();
		const { embeds, components } = interaction.message;
		const embedJson = embeds[0].toJSON();
		const componentJson = components[0].toJSON();

		embedJson.title = 'Town Hall Assistant Ended';
		embedJson.description += `\n**Ended**: <t:${current}:f>`;

		componentJson.components[0].disabled = true;

		await interaction.message.edit({
			embeds: [embedJson],
			components: [componentJson]
		});

		await interaction.deferReply({ ephemeral: true });

		const eligibleAttendees = Object.values(attendees)
			.filter((value) => current - value.timestamp >= duration)
			.map((value) => value.name);

		myCache.mySet('VoiceContext', {
			...myCache.myGet('VoiceContext'),
			[guildId]: defaultVoiceContext
		});
		if (eligibleAttendees.length === 0)
			return interaction.followUp({
				content: 'Sorry, none of eligible member in this event'
			});
		const universalBOM = '\uFEFF';
		let csvContent = universalBOM + 'Discord Name\r\n';

		csvContent = eligibleAttendees.reduce((pre, cur) => {
			return pre + cur + '\r\n';
		}, csvContent);

		const fileMsg = await interaction.channel.send({
			files: [
				{
					name: 'Eligible_Members.csv',
					attachment: Buffer.from(csvContent, 'utf-8')
				}
			]
		});
		const fileLink = sprintf(LINK.DISCORD_MSG, {
			guildId: interaction.guild.id,
			channelId: interaction.channel.id,
			messageId: fileMsg.id
		});

		return interaction.followUp({
			content: `File has been sent to <#${interaction.channel.id}>`,
			components: [
				new ActionRowBuilder<ButtonBuilder>().addComponents([
					new ButtonBuilder()
						.setLabel('Link to this file')
						.setStyle(ButtonStyle.Link)
						.setURL(fileLink)
						.setEmoji('🔗')
				])
			]
		});
	}
});
