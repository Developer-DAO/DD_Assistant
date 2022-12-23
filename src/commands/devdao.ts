import {
	ActionRowBuilder,
	ApplicationCommandOptionType,
	ApplicationCommandType,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
	TextChannel
} from 'discord.js';
import { sprintf } from 'sprintf-js';

import { Command } from '../structures/Command';
import { CommandNameEmun } from '../types/Command';
import { DOCS } from '../utils/const';
import { checkChannelPermission } from '../utils/util';

export default new Command({
	name: CommandNameEmun.Devdao,
	description: 'Developer DAO Assistant',
	type: ApplicationCommandType.ChatInput,
	options: [
		{
			type: ApplicationCommandOptionType.String,
			name: 'query',
			description: 'Search resources of Developer DAO',
			required: true,
			autocomplete: true
		},
		{
			type: ApplicationCommandOptionType.User,
			name: 'target',
			description: 'User to be mentioned'
		}
	],
	execute: ({ interaction, args }) => {
		const user = args.getUser('target');
		const query = args.getString('query');
		const res = DOCS[query];

		if (!res)
			return interaction.reply({
				content: 'Sorry, the query you input is invalid.',
				ephemeral: true
			});

		if (user?.bot)
			return interaction.reply({
				content: 'Sorry, you cannot choose a bot as a target.',
				ephemeral: true
			});
		const permissionCheckingResult = checkChannelPermission(
			interaction.channel as TextChannel,
			interaction.guild.members.me.id
		);

		if (permissionCheckingResult) {
			return interaction.reply({
				content: permissionCheckingResult,
				ephemeral: true
			});
		}
		const resEmbed = new EmbedBuilder()
			.setTitle(res.index)
			.setDescription(
				sprintf(
					'**Channel**: <#%s>\n**Description**: %s\n**Meeting Arrangemnet**: %s\n**Meeting Channel**: <#%s>',
					res.channel,
					res.description,
					res.meeting,
					res.meetingChannel
				)
			)
			.setThumbnail(
				'https://cdn.discordapp.com/attachments/1003702354882867343/1016275984623865876/unknown.png'
			);
		const resActionRow = new ActionRowBuilder<ButtonBuilder>().addComponents([
			new ButtonBuilder()
				.setLabel(res.buttonLabel)
				.setStyle(ButtonStyle.Link)
				.setURL(res.link)
				.setEmoji(res.emoji)
		]);

		if (user) {
			return interaction.reply({
				content: `<@${user.id}>`,
				components: [resActionRow],
				embeds: [resEmbed]
			});
		} else {
			return interaction.reply({
				components: [resActionRow],
				embeds: [resEmbed],
				ephemeral: true
			});
		}
	}
});
