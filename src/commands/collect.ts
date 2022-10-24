import { ApplicationCommandOptionType, ApplicationCommandType, Role } from 'discord.js';

import { Command } from '../structures/Command';

export default new Command({
	name: 'collect',
	description: 'Collect DAO internal data',
    type: ApplicationCommandType.ChatInput,
	options: [
		{
			name: 'role',
			type: ApplicationCommandOptionType.Subcommand,
			description: 'Collect role data',
			options: [
				{
					name: 'target',
					type: ApplicationCommandOptionType.Role,
					description: 'The target role',
					required: false
				}
			]
		}
	],
	execute: async ({ interaction, args }) => {
		const subCommandName = args.getSubcommand();

		if (subCommandName === 'role') {
			const targetRole = args.getRole('target') as Role;
			const attributes = `\uFEFFRole Name,Discord Name,Discord ID\r\n`;

			if (targetRole) {
				const roleName = targetRole.name;
				const csvContents = targetRole.members.reduce((pre, curMember) => {
					return pre + `${roleName},${curMember.displayName},${curMember.id}\r\n`;
				}, attributes);

				return interaction.reply({
					files: [
						{
							name: 'Role_Collection.csv',
							attachment: Buffer.from(csvContents, 'utf-8')
						}
					]
				});
			}

			const roles = await interaction.guild.roles.fetch();

			const csvContents = roles.reduce((pre, curRole) => {
				const roleName = curRole.name;

				return (
					pre +
					curRole.members.reduce((roleContent, curMember) => {
						return (
							roleContent + `${roleName},${curMember.displayName},${curMember.id}\r\n`
						);
					}, '')
				);
			}, attributes);

			return interaction.reply({
				files: [
					{
						name: 'Role_Collection.csv',
						attachment: Buffer.from(csvContents, 'utf-8')
					}
				]
			});
		}
	}
});
