import {
	ApplicationCommandType,
	AutocompleteInteraction,
	CommandInteractionOptionResolver,
	GuildMember,
	Interaction
} from 'discord.js';
import _ from 'lodash';
import { sprintf } from 'sprintf-js';

import { client } from '..';
import { myCache } from '../structures/Cache';
import { Event } from '../structures/Event';
import { ExtendedButtonInteraction } from '../types/Button';
import { ExtendedCommandInteration } from '../types/Command';
import {
	ExtendedMessageContextMenuInteraction,
	ExtendedUserContextMenuInteraction
} from '../types/ContextMenu';
import { ExtendedModalSubmitInteraction } from '../types/Modal';
import { ButtonCollectorCustomIdRecord, ERROR_REPLY } from '../utils/const';
import { logger } from '../utils/logger';

export default new Event('interactionCreate', async (interaction: Interaction) => {
	const errorInform = {
		userName: interaction?.user?.username,
		guildName: interaction?.guild?.name
	};

	if (!myCache.myHasAll()) {
		if (interaction.isAutocomplete()) {
			return interaction.respond([]);
		} else {
			return interaction.reply({
				content: 'Bot is initing... Please try again later.',
				ephemeral: true
			});
		}
	}

	if (interaction.isCommand()) {
		const command = client.commands.get(interaction.commandName);

		if (!command) {
			return interaction.reply({
				content: 'You have used a non exitent command',
				ephemeral: true
			});
		}
		try {
			switch (command.type) {
				case ApplicationCommandType.ChatInput: {
					const member = interaction.member as GuildMember;
					const guildInformCache = myCache.myGet('Guild')[interaction.guild.id];
					const { adminCommand, adminMember, adminRole } = guildInformCache;

					if (adminCommand.includes(interaction.commandName)) {
						if (
							!adminMember.includes(member.id) &&
							_.intersection(Array.from(member.roles.cache.keys()), adminRole)
								.length === 0
						)
							return interaction.reply({
								content: "Sorry, you don't have permission to run this command.",
								ephemeral: true
							});
					}
					await command.execute({
						client: client,
						interaction: interaction as ExtendedCommandInteration,
						args: interaction.options as CommandInteractionOptionResolver
					});
					break;
				}
				case ApplicationCommandType.Message: {
					await command.execute({
						interaction: interaction as ExtendedMessageContextMenuInteraction
					});
					break;
				}
				case ApplicationCommandType.User: {
					await command.execute({
						interaction: interaction as ExtendedUserContextMenuInteraction
					});
					break;
				}
			}
		} catch (error) {
			let errorMsg: string;

			if (command.type === ApplicationCommandType.ChatInput) {
				errorMsg = sprintf(ERROR_REPLY.INTERACTION, {
					...errorInform,
					commandName: interaction.commandName,
					errorName: error?.name,
					errorMsg: error?.message,
					errorStack: error?.stack
				});
			} else {
				errorMsg = sprintf(ERROR_REPLY.MENU, {
					...errorInform,
					commandName: interaction.commandName,
					errorName: error?.name,
					errorMsg: error?.message,
					errorStack: error?.stack
				});
			}

			if (interaction.deferred) {
				logger.error(errorMsg);
				return interaction.followUp({
					content: ERROR_REPLY.COMMON
				});
			}
			if (!interaction.replied) {
				logger.error(errorMsg);
				interaction.reply({
					content: ERROR_REPLY.COMMON,
					ephemeral: true
				});
			}
		}
	}

	if (interaction.isButton()) {
		const button = client.buttons.get(interaction.customId);

		if (!button) {
			if (Object.keys(ButtonCollectorCustomIdRecord).includes(interaction.customId)) return;
			return interaction.reply({
				content: 'You have clicked a non exitent button',
				ephemeral: true
			});
		}

		try {
			await button.execute({
				client: client,
				interaction: interaction as ExtendedButtonInteraction
			});
		} catch (error) {
			const errorMsg = sprintf(ERROR_REPLY.BUTTON, {
				...errorInform,
				customId: interaction.customId,
				errorName: error?.name,
				errorMsg: error?.message,
				errorStack: error?.stack
			});

			if (interaction.deferred) {
				logger.error(errorMsg);
				return interaction.followUp({
					content: ERROR_REPLY.COMMON
				});
			}
			if (!interaction.replied) {
				logger.error(errorMsg);
				interaction.reply({
					content: ERROR_REPLY.COMMON,
					ephemeral: true
				});
			}
		}
	}

	if (interaction.isModalSubmit()) {
		const modal = client.modals.get(interaction.customId);

		if (!modal) {
			return interaction.reply({
				content: 'You have clicked a non exitent modal',
				ephemeral: true
			});
		}

		try {
			await modal.execute({
				client: client,
				interaction: interaction as ExtendedModalSubmitInteraction
			});
		} catch (error) {
			const errorMsg = sprintf(ERROR_REPLY.MODAL, {
				...errorInform,
				customId: interaction.customId,
				errorName: error?.name,
				errorMsg: error?.message,
				errorStack: error?.stack
			});

			if (interaction.deferred) {
				logger.error(errorMsg);
				return interaction.followUp({
					content: ERROR_REPLY.COMMON
				});
			}
			if (!interaction.replied) {
				logger.error(errorMsg);
				interaction.reply({
					content: ERROR_REPLY.COMMON,
					ephemeral: true
				});
			}
		}
	}

	if (interaction.isAutocomplete()) {
		const auto = client.autos.get(interaction.commandName);

		if (!auto) {
			logger.error(`A non exitent auto is triggered: ${interaction.commandName}`);
			return interaction.respond([]);
		}

		try {
			await auto.execute({
				client: client,
				interaction: interaction as AutocompleteInteraction
			});
		} catch (error) {
			return logger.error(
				sprintf(ERROR_REPLY.AUTO, {
					...errorInform,
					commandName: interaction.commandName,
					errorName: error?.name,
					errorMsg: error?.message,
					errorStack: error?.stack
				})
			);
		}
	}
});
