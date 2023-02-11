import {
	ActionRowBuilder,
	ApplicationCommandOptionType,
	ApplicationCommandType,
	EmbedBuilder,
	ModalBuilder,
	TextChannel,
	TextInputBuilder,
	TextInputStyle
} from 'discord.js';

import { prisma } from '../prisma/prisma';
import { myCache } from '../structures/Cache';
import { Command } from '../structures/Command';
import { CommandNameEmun } from '../types/Command';
import { awaitWrap, checkTextChannelPermission } from '../utils/util';

export default new Command({
	name: CommandNameEmun.Contact,
	description: 'DAO internal points of contact.',
	type: ApplicationCommandType.ChatInput,
	options: [
		{
			name: 'add',
			description: 'Add contact to this member',
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: 'member',
					description: 'Choose the member from this list',
					required: true,
					type: ApplicationCommandOptionType.User
				}
			]
		},
		{
			name: 'display',
			description: 'Display contact information in current channel',
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: 'member',
					description: 'Choose the member from this list',
					required: true,
					type: ApplicationCommandOptionType.User
				}
			]
		}
	],
	execute: async ({ interaction, args }) => {
		const subCommandName = args.getSubcommand();
		const { guildId, channel, guild } = interaction;

		if (subCommandName === 'add') {
			const user = args.getUser('member');
			const modal = new ModalBuilder()
				.setTitle('Create Point of Contact')
				.setCustomId('contact')
				.addComponents(
					new ActionRowBuilder<TextInputBuilder>().addComponents([
						new TextInputBuilder()
							.setCustomId('title')
							.setLabel('Name his/her Role')
							.setStyle(TextInputStyle.Short)
					])
				)
				.addComponents(
					new ActionRowBuilder<TextInputBuilder>().addComponents([
						new TextInputBuilder()
							.setCustomId('description')
							.setLabel('What his/her introduction')
							.setPlaceholder('Support markdown grammar')
							.setStyle(TextInputStyle.Paragraph)
					])
				);

			myCache.mySet('ContactModalCache', {
				...myCache.myGet('ContactModalCache'),
				[interaction.user.id]: {
					id: user.id
				}
			});
			return interaction.showModal(modal);
		}

		if (subCommandName === 'display') {
			const user = args.getUser('member');
			let memberName = user.username;
			let memberAvatar = user.avatarURL();
			const member = guild.members.cache.get(user.id);

			if (member) {
				memberName = member.displayName;
				memberAvatar = member.displayAvatarURL();
			}
			const permissionChecking = checkTextChannelPermission(
				channel as TextChannel,
				guild.members.me.id
			);

			if (permissionChecking) {
				return interaction.reply({
					content: `I cannot send contact in this channel, becasue ${permissionChecking}`,
					ephemeral: true
				});
			}

			await interaction.deferReply({ ephemeral: true });
			const { result, error } = await awaitWrap(
				prisma.contact.findFirst({
					where: {
						id: user.id,
						discordId: guildId
					}
				})
			);

			if (error) {
				return interaction.followUp({
					content: 'Sorry, error in database.'
				});
			}

			if (!result) {
				return interaction.followUp({
					content: `Sorry, I cannot find this \`${memberName}\` in the database.`
				});
			}
			const embed = new EmbedBuilder()
				.setTitle(result.title)
				.setDescription(result.description)
				.setThumbnail(memberAvatar);

			await channel.send({
				embeds: [embed]
			});

			return interaction.followUp({
				content: 'Point of contact has been sent to this channel.'
			});
		}
	}
});
