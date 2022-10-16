import { ButtonBuilder } from '@discordjs/builders';
import {
	ActionRowBuilder,
	ButtonStyle,
	EmbedBuilder,
	MessageType,
	TextChannel,
	ThreadChannel
} from 'discord.js';
import { sprintf } from 'sprintf-js';

import { Button } from '../structures/Button';
import { myCache } from '../structures/Cache';
import { COMMAND_CONTENT, EMOJI } from '../utils/const';
import { fetchOnboardingSchedule } from '../utils/util';

export default new Button({
	customIds: ['schedule', 'talk', 'talk_yes', 'talk_no'],
	execute: async ({ interaction }) => {
		switch (interaction.customId) {
			case 'schedule':
				return interaction.reply({
					embeds: [fetchOnboardingSchedule(interaction.guild.id)],
					ephemeral: true
				});
			case 'talk': {
				return interaction.reply({
					content:
						"✅ **Yes** -- Create a thread for you and our onboarding team members will reach you out.\n\n❌ **No** -- I'd like to walk through and hang out.",
					components: [
						new ActionRowBuilder<ButtonBuilder>().addComponents([
							new ButtonBuilder()
								.setCustomId('talk_yes')
								.setLabel('Yes')
								.setEmoji({ id: EMOJI.CHECK_MARK })
								.setStyle(ButtonStyle.Primary),
							new ButtonBuilder()
								.setCustomId('talk_no')
								.setLabel('No')
								.setEmoji({ id: EMOJI.WRONG })
								.setStyle(ButtonStyle.Secondary)
						])
					],
					ephemeral: true
				});
			}
			case 'talk_yes': {
				await interaction.deferReply({ ephemeral: true });
				const messages = (
					await interaction.channel.messages.fetch({
						limit: 50
					})
				).filter(
					(msg) => msg.author.id === interaction.user.id && msg.type !== MessageType.Reply
				);
				let welcomeThread: ThreadChannel;
				const currentChannel = interaction.channel as TextChannel;
				const welcomeThreadName = sprintf(
					COMMAND_CONTENT.WELCOME_THREAD_NAME,
					interaction.user.id
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
								}> for you`
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
					myCache.myGet('Guild')[interaction.guild.id].channels;
				const onboardNotifyChannel = interaction.guild.channels.cache.get(
					onboardNotificationChannel
				) as TextChannel;

				if (currentChannel.id === introductionChannel) {
					welcomeThread.send({
						content: COMMAND_CONTENT.THREAD_WELCOME_MSG
					});
				} else {
					welcomeThread.send({
						content: COMMAND_CONTENT.WOMEN_THREAD_WELCOME_MSG
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
					content: `Your thread has been created <#${welcomeThread.id}>. Welcome to Developer DAO`
				});
			}
			case 'talk_no':
				return interaction.reply({
					content: 'Welcome to Developer DAO! See you in the DAO!'
				});
		}
	}
});
