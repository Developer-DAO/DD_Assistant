import { ApplicationCommandOptionType, ApplicationCommandType, ChannelType } from 'discord.js';

import { Command } from '../structures/Command';
import { CommandNameEmun } from '../types/Command';

export default new Command({
	name: CommandNameEmun.Mentorship,
	description: 'Mentorship helper',
	type: ApplicationCommandType.ChatInput,
	options: [
		{
			type: ApplicationCommandOptionType.SubcommandGroup,
			description: 'Configure mentorship',
			name: 'configure',
			options: [
				{
					type: ApplicationCommandOptionType.Subcommand,
					name: 'add_adminrole',
					description: 'Add admin role for sub-commands',
					options: [
						{
							name: 'role',
							description: 'Choose a role as admin role',
							type: ApplicationCommandOptionType.Role,
							required: true
						}
					]
				},
				{
					type: ApplicationCommandOptionType.Subcommand,
					name: 'remove_adminrole',
					description: 'Remove admin role for current settings',
					options: [
						{
							name: 'role',
							description: 'Choose a role to be removed',
							type: ApplicationCommandOptionType.String,
							required: true,
							autocomplete: true
						}
					]
				},
				{
					type: ApplicationCommandOptionType.Subcommand,
					name: 'channel',
					description: 'Set up mentorship channels',
					options: [
						{
							name: 'playground',
							description: 'Choose a channel as a playground channel',
							type: ApplicationCommandOptionType.Channel,
							channelTypes: [ChannelType.GuildText]
						},
						{
							name: 'mentor',
							description: 'Choose a channel as a mentor channel',
							type: ApplicationCommandOptionType.Channel,
							channelTypes: [ChannelType.GuildText]
						}
					]
				},
				{
					type: ApplicationCommandOptionType.Subcommand,
					name: 'token_reward',
					description: 'Set up the amount of token per mins',
					options: [
						{
							name: 'amount',
							description: 'Type an integer',
							type: ApplicationCommandOptionType.Integer,
							required: true
						}
					]
				}
			]
		},
		{
			type: ApplicationCommandOptionType.Subcommand,
			name: 'add_pair',
			description: 'Add mentor-mentee pair',
			options: [
				{
					name: 'mentor',
					description: 'Choose the mentor',
					type: ApplicationCommandOptionType.User,
					required: true
				},
				{
					name: 'mentee',
					description: 'Choose the mentees, mention mentees in this option.',
					type: ApplicationCommandOptionType.String,
					required: true
				}
			]
		},
		{
			type: ApplicationCommandOptionType.Subcommand,
			name: 'start_epoch',
			description: 'Start the next epoch to gather mentorship information.'
		},
		{
			type: ApplicationCommandOptionType.SubcommandGroup,
			name: 'collect',
			description: 'Collect mentorship based on epoch.',
			options: [
				{
					name: 'latest',
					description: 'Collect latest/current epoch information',
					type: ApplicationCommandOptionType.Subcommand
				},
				{
					name: 'all',
					description: 'Collect all epoch information',
					type: ApplicationCommandOptionType.Subcommand
				},
				{
					name: 'one',
					description: 'Collect one epoch information',
					type: ApplicationCommandOptionType.Subcommand,
					options: [
						{
							name: 'epoch',
							description: "Choose which epoch you'd like to collect",
							type: ApplicationCommandOptionType.String,
							required: true,
							autocomplete: true
						}
					]
				}
			]
		}
	],
	execute: ({ interaction, args }) => {
		const subCommandGroupName = args.getSubcommandGroup();
		const subCommandName = args.getSubcommand();

		console.log(subCommandGroupName, subCommandName);
		return interaction.reply({
			content: 'WIP'
		});
	}
});
