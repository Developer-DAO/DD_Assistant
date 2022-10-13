import { OnboardInform } from '@prisma/client';
import { ApplicationCommandOptionType, ChannelType, TextChannel } from 'discord.js';
import { sprintf } from 'sprintf-js';
import { prisma } from '../prisma/prisma';
import { myCache } from '../structures/Cache';
import { Command } from '../structures/Command';
import { COMMAND_CONTENT } from '../utils/const';
import { awaitWrap, convertTimeStamp, fetchOnboardingSchedule } from '../utils/util';

export default new Command({
	name: 'onboard',
	description: 'Handle affairs related to onboarding progress',
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
			return interaction.reply({
				embeds: [fetchOnboardingSchedule(guildId)]
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
			const onboardInformArray: Array<OnboardInform> = [];
			const currentTimeStamp = Math.floor(new Date().getTime() / 1000);
			seshEmbed.fields.forEach((field) => {
				const { value } = field;
				let eventIndex: Array<number> = [];
				value.match(/\[.+\]/g)?.filter((name, index) => {
					if (name === COMMAND_CONTENT.ONBOARDING_CALL_EVENT_NAME) {
						eventIndex.push(index);
						return true;
					} else return false;
				});
				if (eventIndex.length === 0) return;
				const matchEventTimeStamps = value.match(/<t:\d+:R>/g);
				const matchEventLinks = value.match(
					/(https:\/\/discord\.com\/channels\/\d+\/\d+\/\d+)/g
				);
				eventIndex.forEach((index) => {
					const timestamp = matchEventTimeStamps[index].slice(3, -3);
					if (currentTimeStamp > Number(timestamp)) return;
					onboardInformArray.push({
						timestamp: timestamp,
						eventLink: matchEventLinks[index]
					});
				});
			});

			if (onboardInformArray.length === 0) {
				return interaction.followUp({
					content: `I cannot find \`${COMMAND_CONTENT.ONBOARDING_CALL_EVENT_NAME}\` event or they are outdated.`
				});
			}

			await prisma.guilds.update({
				where: {
					discordId: guildId
				},
				data: {
					onboardSchedule: onboardInformArray
				}
			});
			const guildInformCache = myCache.myGet('Guild')[guildId];
			myCache.mySet('Guild', {
				...myCache.myGet('Guild'),
				[guildId]: {
					...guildInformCache,
					onboardSchedule: onboardInformArray
				}
			});

			return interaction.followUp({
				embeds: [fetchOnboardingSchedule(guildId)],
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
				timestamp: convertTimeStamp(removedSchedule.timestamp)
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

			return interaction.followUp({
				content: `\`${removedContent}\` has been removed successfully.`,
				embeds: [fetchOnboardingSchedule(guildId)]
			});
		}
	}
});
