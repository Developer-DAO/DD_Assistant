import { EmbedBuilder, MessageType, TextChannel, ThreadChannel } from 'discord.js';
import { sprintf } from 'sprintf-js';

import { Button } from '../structures/Button';
import { myCache } from '../structures/Cache';
import { CallType } from '../types/Util';
import { COMMAND_CONTENT } from '../utils/const';
import { fetchCallSchedule } from '../utils/util';

export default new Button({
	customIds: ['schedule', 'talk'],
	execute: async ({ interaction }) => {
		const { guildId } = interaction;

		switch (interaction.customId) {
			case 'schedule': {
				const { introductionChannel, womenIntroductionChannel } =
					myCache.myGet('Guild')[guildId].channels;
				let callEmbed: EmbedBuilder;

				if (interaction.channelId === introductionChannel) {
					callEmbed = await fetchCallSchedule(guildId, CallType.ONBOARDING);
				} else if (interaction.channelId === womenIntroductionChannel) {
					callEmbed = await fetchCallSchedule(guildId, CallType.WOMENVIBES);
				} else {
					return interaction.reply({
						content: 'Sorry, the button you click does not exist.',
						ephemeral: true
					});
				}

				return interaction.reply({
					embeds: [callEmbed],
					ephemeral: true
				});
			}
			case 'talk': {
				await interaction.deferReply({ ephemeral: true });
				const messages = (
					await interaction.channel.messages.fetch({
						limit: 25
					})
				).filter(
					(msg) =>
						msg.author.id === interaction.user.id &&
						msg.type !== MessageType.Reply &&
						msg.type !== MessageType.ThreadCreated &&
						msg.type !== MessageType.ChatInputCommand &&
						msg.type !== MessageType.ContextMenuCommand
				);
				let welcomeThread: ThreadChannel;
				const currentChannel = interaction.channel as TextChannel;
				const welcomeThreadName = sprintf(
					COMMAND_CONTENT.WELCOME_THREAD_NAME,
					interaction.member.displayName
				);

				if (messages.size === 0) {
					welcomeThread = await currentChannel.threads.create({
						name: welcomeThreadName
					});
				} else {
					if (messages.first().hasThread) {
						if (messages.first().thread.name.startsWith('Welcome')) {
							return interaction.followUp({
								content: `Sorry, I have created a welcome thread <#${
									messages.first().thread.id
								}> for you`,
								components: []
							});
						}
						welcomeThread = await currentChannel.threads.create({
							name: welcomeThreadName
						});
					} else {
						welcomeThread = await messages.first().startThread({
							name: welcomeThreadName
						});
					}
				}
				const { introductionChannel, onboardNotificationChannel } =
					myCache.myGet('Guild')[guildId].channels;
				const onboardNotifyChannel = interaction.guild.channels.cache.get(
					onboardNotificationChannel
				) as TextChannel;

				if (currentChannel.id === introductionChannel) {
					const devdaoCommand = interaction.guild.commands.cache.find(
						(command) => command.name === 'devdao'
					);
					const devdaoCommandId = devdaoCommand?.id ?? '0';
					const callEmbed = await fetchCallSchedule(guildId, CallType.ONBOARDING);

					welcomeThread.send({
						content: sprintf(COMMAND_CONTENT.THREAD_WELCOME_MSG, {
							newComerId: interaction.user.id,
							devdaoCommandId: devdaoCommandId
						}),
						embeds: [callEmbed]
					});
				} else {
					const callEmbed = await fetchCallSchedule(guildId, CallType.WOMENVIBES);

					welcomeThread.send({
						content: COMMAND_CONTENT.WOMEN_THREAD_WELCOME_MSG,
						embeds: [callEmbed]
					});
				}

				if (onboardNotificationChannel) {
					onboardNotifyChannel.send({
						embeds: [
							new EmbedBuilder()
								.setAuthor({
									name: `@Onboarding --- Welcome ${interaction.member.displayName}!`,
									iconURL: interaction.member.displayAvatarURL()
								})
								.setDescription(
									`Welcome to our new member in <#${welcomeThread.id}>`
								)
						]
					});
				}

				return interaction.followUp({
					content: `Your thread has been created <#${welcomeThread.id}>. Welcome to Developer DAO`,
					components: []
				});
			}
		}
	}
});
