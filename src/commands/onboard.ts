import { ApplicationCommandOptionType, ApplicationCommandType, ChannelType } from 'discord.js';
import { sprintf } from 'sprintf-js';

import { prisma } from '../prisma/prisma';
import { myCache } from '../structures/Cache';
import { Command } from '../structures/Command';
import { COMMAND_CONTENT } from '../utils/const';
import { awaitWrap, convertTimeStamp, fetchOnboardingSchedule, searchEvent } from '../utils/util';

export default new Command({
	name: 'onboard',
	description: 'Handle affairs related to onboarding progress',
	type: ApplicationCommandType.ChatInput,
	options: [
		{
			type: ApplicationCommandOptionType.Subcommand,
			name: 'add_schedule',
			description: 'Set onboarding schedule for this week',
			options: [
				{
					type: ApplicationCommandOptionType.String,
					name: 'link',
					required: true,
					description: 'Event list link from sesh bot'
				}
			]
		},
		{
			type: ApplicationCommandOptionType.Subcommand,
			name: 'remove_schedule',
			description: 'Set onboarding schedule for this week',
			options: [
				{
					type: ApplicationCommandOptionType.String,
					name: 'schedule',
					required: true,
					description: 'Which schedule you would like to remove',
					autocomplete: true
				}
			]
		},
		{
			type: ApplicationCommandOptionType.Subcommand,
			name: 'read',
			description: 'Read current onboarding call schedule'
		}
	],
	execute: async ({ interaction, args }) => {
		const subcommand = args.getSubcommand();
		const guildId = interaction.guild.id;

		if (subcommand === 'read') {
			const onboardingEmbeds = await fetchOnboardingSchedule(guildId);

			return interaction.reply({
				embeds: [onboardingEmbeds]
			});
		}

		if (!myCache.myGet('Guild')[guildId].channels.introductionChannel) {
			// todo change commandName with a clickable one
			return interaction.reply({
				content: `Please set up introduction channel first using \`/${interaction.commandName}\`.`,
				ephemeral: true
			});
		}

		if (subcommand === 'add_schedule') {
			const scheduleLink = args.getString('link');

			await interaction.deferReply({
				ephemeral: true
			});

			const prefixLinks = scheduleLink.match(/https:\/\/discord.com\/channels\//g);

			if (!prefixLinks) {
				return interaction.followUp({
					content: 'You link is wrong, please check it again.'
				});
			}

			const [seshGuildId, channelId, messageId] = scheduleLink
				.replace(prefixLinks[0], '')
				.split('/');

			const targetChannel = interaction.guild.channels.cache.get(channelId);

			if (
				seshGuildId !== guildId ||
				!targetChannel ||
				targetChannel.type !== ChannelType.GuildText
			) {
				return interaction.followUp({
					content: 'You link is wrong, please check it again.'
				});
			}

			const { result: targetMessage, error } = await awaitWrap(
				targetChannel.messages.fetch(messageId)
			);

			if (error) {
				return interaction.followUp({
					content: 'The onboarding schedule event is unfetchable.'
				});
			}

			const embeds = targetMessage.embeds;

			if (embeds.length === 0) {
				return interaction.followUp({
					content: 'You link is wrong, please check it again.'
				});
			}

			const seshEmbed = embeds[0]?.toJSON();

			if (!seshEmbed) {
				return interaction.followUp({
					content: 'You link is wrong, please check it again.'
				});
			}
			const searchResult = await searchEvent(seshEmbed.fields, guildId);

			if (searchResult) {
				return interaction.followUp({
					content: searchResult
				});
			}
			const onboardingEmbeds = await fetchOnboardingSchedule(guildId);

			return interaction.followUp({
				content: 'Onboarding call scheduel has been updated.',
				embeds: [onboardingEmbeds],
				ephemeral: true
			});
		}

		if (subcommand === 'remove_schedule') {
			const index = Number(args.getString('schedule'));

			if (!index) {
				return interaction.reply({
					content: 'Please choose a valid schedule.',
					ephemeral: true
				});
			}

			if (index < 0) {
				return interaction.reply({
					content: 'There is no onboarding call schedule now. Please add one first',
					ephemeral: true
				});
			}

			await interaction.deferReply({ ephemeral: true });
			const guildInformCache = myCache.myGet('Guild')[guildId];
			const newOnboardScheduleCache = guildInformCache.onboardSchedule;
			const removedSchedule = newOnboardScheduleCache.splice(index - 1, 1)[0];
			const removedContent = sprintf(COMMAND_CONTENT.ONBOARDING_OPTION, {
				index: index,
				timestamp: convertTimeStamp(Number(removedSchedule.timestamp))
			});

			await prisma.guilds.update({
				where: {
					discordId: guildId
				},
				data: {
					onboardSchedule: newOnboardScheduleCache
				}
			});

			myCache.mySet('Guild', {
				...myCache.myGet('Guild'),
				[guildId]: {
					...guildInformCache,
					onboardSchedule: newOnboardScheduleCache
				}
			});
			const onboardingEmbeds = await fetchOnboardingSchedule(guildId);

			return interaction.followUp({
				content: `\`${removedContent}\` has been removed successfully.`,
				embeds: [onboardingEmbeds]
			});
		}
	}
});
