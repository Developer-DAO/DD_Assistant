import {
	ActionRowBuilder,
	ApplicationCommandOptionType,
	ApplicationCommandType,
	ButtonBuilder,
	ButtonStyle,
	ChannelType,
	EmbedBuilder,
	VoiceChannel
} from 'discord.js';
import { sprintf } from 'sprintf-js';

import { myCache } from '../structures/Cache';
import { Command } from '../structures/Command';
import { MemberVoiceInform } from '../types/Cache';
import { LINK } from '../utils/const';
import { checkVoiceChannelPermission, getCurrentTimeMin } from '../utils/util';

export default new Command({
	name: 'townhall',
	description: 'Help to record town hall',
	type: ApplicationCommandType.ChatInput,
	options: [
		{
			name: 'channel',
			type: ApplicationCommandOptionType.Channel,
			description: 'The voice channel to hold the town hall',
			required: true,
			channelTypes: [ChannelType.GuildVoice]
		},
		{
			name: 'reward_duration',
			type: ApplicationCommandOptionType.Integer,
			description: 'The duration to be eligible for the reward, measured in minute',
			required: true
		}
	],
	execute: async ({ interaction, args }) => {
		const guildId = interaction.guild.id;
		const guildVoiceContext = myCache.myGet('VoiceContext')[guildId];

		if (guildVoiceContext.channelId) {
			return interaction.reply({
				content: 'Sorry, the town hall is going on now.',
				components: [
					new ActionRowBuilder<ButtonBuilder>().addComponents([
						new ButtonBuilder()
							.setLabel('Jump to the dashboard')
							.setEmoji('🔗')
							.setStyle(ButtonStyle.Link)
							.setURL(guildVoiceContext.messageLink)
					])
				],
				ephemeral: true
			});
		} else {
			const voiceChannel = args.getChannel('channel') as VoiceChannel;
			const rewardDuration = args.getInteger('reward_duration');

			const permissionCheckingResult = checkVoiceChannelPermission(
				voiceChannel,
				interaction.guild.members.me.id
			);

			if (permissionCheckingResult) {
				return interaction.reply({
					content: permissionCheckingResult,
					ephemeral: true
				});
			}

			if (rewardDuration <= 0)
				return interaction.reply({
					content: 'Reward duration cannot be smaller than 1.',
					ephemeral: true
				});

			const membersVoiceInform: MemberVoiceInform = {};

			const current = getCurrentTimeMin();

			voiceChannel.members.forEach((member, memberId) => {
				if (member.user.bot) return;
				membersVoiceInform[memberId] = {
					timestamp: current,
					name: member.displayName
				};
			});

			await interaction.deferReply({ ephemeral: true });

			const msg = await voiceChannel.send({
				embeds: [
					new EmbedBuilder()
						.setAuthor({
							name: interaction.user.tag,
							iconURL: interaction.user.avatarURL()
						})
						.setTitle('Town Hall Assistant Started')
						.setDescription(
							`**Channel**: <#${voiceChannel.id}>\n**Reward Duration**: \`${rewardDuration} mins\`\n**Started**: <t:${current}:f>(<t:${current}:R>)`
						)
				],
				components: [
					new ActionRowBuilder<ButtonBuilder>().addComponents([
						new ButtonBuilder()
							.setCustomId('end')
							.setLabel('End this event')
							.setEmoji('⏹️')
							.setStyle(ButtonStyle.Danger),
						new ButtonBuilder()
							.setCustomId('number')
							.setLabel('Participants Number')
							.setEmoji('🧮')
							.setStyle(ButtonStyle.Primary)
					])
				]
			});
			const msgLink = sprintf(LINK.DISCORD_MSG, {
				guildId: interaction.guild.id,
				channelId: voiceChannel.id,
				messageId: msg.id
			});

			myCache.mySet('VoiceContext', {
				...myCache.myGet('VoiceContext'),
				[guildId]: {
					attendees: {
						...membersVoiceInform
					},
					messageLink: msgLink,
					hostId: interaction.user.id,
					channelId: voiceChannel.id,
					duration: rewardDuration * 60,
					messageId: msg.id
				}
			});

			return interaction.followUp({
				content: 'Town hall assistant has started.',
				components: [
					new ActionRowBuilder<ButtonBuilder>().addComponents([
						new ButtonBuilder()
							.setLabel('Jump to the dashboard')
							.setEmoji('🔗')
							.setStyle(ButtonStyle.Link)
							.setURL(msgLink)
					])
				]
			});
		}
	}
});
