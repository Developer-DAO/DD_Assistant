import { AutocompleteInteraction, CommandInteractionOptionResolver, Interaction } from 'discord.js';
import { Event } from '../structures/Event';
import { ExtendedButtonInteraction } from '../types/Button';
import { ExtendedCommandInteration } from '../types/Command';
import { ExtendedModalSubmitInteraction } from '../types/Modal';
import { myCache } from '../structures/Cache';
import { logger } from '../utils/logger';
import { sprintf } from 'sprintf-js';
import { ERROR_REPLY } from '../utils/const';

import _ from 'lodash';
import { client } from '..';

export default new Event('interactionCreate', async (interaction: Interaction) => {
	const errorInform = {
		userName: interaction?.user?.username,
		guildName: interaction?.guild?.name
	};

	if (!interaction.isAutocomplete()) {
		if (!myCache.myHas('Guild') || !myCache.myHas('VoiceContext'))
			return interaction.reply({
				content: 'Bot is initing... Please try again later.',
				ephemeral: true
			});
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
			await command.execute({
				client: client,
				interaction: interaction as ExtendedCommandInteration,
				args: interaction.options as CommandInteractionOptionResolver
			});
		} catch (error) {
			const errorMsg = sprintf(ERROR_REPLY.INTERACTION, {
				...errorInform,
				commandName: interaction.commandName,
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

	if (interaction.isButton()) {
		const button = client.buttons.get(interaction.customId);

		if (!button) {
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
				interaction.followUp({
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

	if (interaction.isUserContextMenuCommand() || interaction.isMessageContextMenuCommand()) {
		const menu = client.menus.get(interaction.commandName);

		if (!menu) {
			return interaction.reply({
				content: `A non exitent context menu is triggered: ${interaction.commandName}`,
				ephemeral: true
			});
		}

		try {
			await menu.execute({
				client: client,
				interaction: interaction
			});
		} catch (error) {
			const errorMessage = sprintf(ERROR_REPLY.MENU, {
				...errorInform,
				menuName: interaction.commandName,
				errorName: error?.name,
				errorMsg: error?.message,
				errorStack: error?.stack
			});
			if (interaction.deferred) {
				logger.error(errorMessage);
				interaction.followUp({
					content: ERROR_REPLY.COMMON
				});
			}
			if (!interaction.replied) {
				logger.error(errorMessage);
				interaction.reply({
					content: ERROR_REPLY.COMMON,
					ephemeral: true
				});
			}
		}
	}
});
