import { ActionRowBuilder, ButtonBuilder, ButtonStyle, VoiceChannel } from 'discord.js';
import { sprintf } from 'sprintf-js';

import { Button } from '../structures/Button';
import { myCache } from '../structures/Cache';
import { defaultVoiceContext, LINK } from '../utils/const';
import { getCurrentTimeMin } from '../utils/util';

export default new Button({
	customIds: ['end', 'number'],
	execute: async ({ interaction }) => {
		switch (interaction.customId) {
			case 'end': {
				const guildId = interaction.guild.id;
				const { hostId, attendees, duration, messageId } =
					myCache.myGet('VoiceContext')[guildId];

				if (interaction.message.id !== messageId) {
					return interaction.reply({
						content: 'Sorry, cannot find this Town Hall, please set up a new one',
						ephemeral: true
					});
				}

				if (interaction.user.id !== hostId) {
					return interaction.reply({
						content: 'Sorry, only the host can end this event.',
						ephemeral: true
					});
				}

				const current = getCurrentTimeMin();
				const { embeds, components } = interaction.message;
				const embedJson = embeds[0].toJSON();
				const componentJson = components[0].toJSON();

				embedJson.title = 'Town Hall Assistant Ended';
				embedJson.description += `\n**Ended**: <t:${current}:f>`;

				componentJson.components[0].disabled = true;
				componentJson.components[1].disabled = true;

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
			case 'number': {
				const channel = interaction.channel as VoiceChannel;

				return interaction.reply({
					content: `Current number of attendees: ${channel.members.size}.`,
					ephemeral: true
				});
			}
		}
	}
});
