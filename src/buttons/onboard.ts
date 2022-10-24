import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
	MessageType,
	TextChannel,
	ThreadChannel
} from 'discord.js';
import { sprintf } from 'sprintf-js';

import { Button } from '../structures/Button';
import { myCache } from '../structures/Cache';
import { COMMAND_CONTENT } from '../utils/const';
import { fetchOnboardingSchedule } from '../utils/util';

export default new Button({
	customIds: ['schedule', 'talk', 'talk_yes', 'talk_no'],
	execute: async ({ interaction }) => {
		const { guildId } = interaction;

		switch (interaction.customId) {
			case 'schedule': {
				const onboardingEmbeds = await fetchOnboardingSchedule(guildId);

				return interaction.reply({
					embeds: [onboardingEmbeds],
					ephemeral: true
				});
			}
			case 'talk': {
				return interaction.reply({
					content:
						"✅ **Yes** -- Create a thread for you and our onboarding team members will reach you out.\n\n❌ **No** -- I'd like to walk through and hang out.",
					components: [
						new ActionRowBuilder<ButtonBuilder>().addComponents([
							new ButtonBuilder()
								.setCustomId('talk_yes')
								.setLabel('Yes')
								.setStyle(ButtonStyle.Primary)
								.setEmoji('✅'),
							new ButtonBuilder()
								.setCustomId('talk_no')
								.setLabel('No')
								.setEmoji('❌')
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
					myCache.myGet('Guild')[guildId].channels;
				const onboardNotifyChannel = interaction.guild.channels.cache.get(
					onboardNotificationChannel
				) as TextChannel;
				const onboardEmbeds = await fetchOnboardingSchedule(guildId);

				if (currentChannel.id === introductionChannel) {
					const devdaoCommand = interaction.guild.commands.cache.find(
						(command) => command.name === 'devdao'
					);
					const devdaoCommandId = devdaoCommand?.id ?? '0';

					welcomeThread.send({
						content: sprintf(COMMAND_CONTENT.THREAD_WELCOME_MSG, {
							newComerId: interaction.user.id,
							devdaoCommandId: devdaoCommandId
						}),
						embeds: [onboardEmbeds]
					});
				} else {
					welcomeThread.send({
						content: COMMAND_CONTENT.WOMEN_THREAD_WELCOME_MSG,
						embeds: [onboardEmbeds]
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
					content: 'Welcome to Developer DAO! See you in the DAO!',
					ephemeral: true
				});
		}
	}
});
