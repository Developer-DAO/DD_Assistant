import { Auto } from '../structures/AutoComplete';
import { myCache } from '../structures/Cache';
import { GuildInform } from '../types/Cache';
import { NUMBER } from '../utils/const';

export default new Auto({
	correspondingCommandName: 'guild',
	execute: ({ interaction }) => {
		const guildId = interaction.guild.id;
		const { name, value } = interaction.options.getFocused(true);

		if (!myCache.myHas('Guild')) return interaction.respond([]);
		const guildInform: GuildInform = myCache.myGet('Guild')[guildId];

		let filter: Array<any> = [];

		switch (name) {
			case 'role': {
				const currentRoles = guildInform.adminRole;

				filter = currentRoles
					.map((roleId) => ({
						name: interaction.guild.roles.cache.get(roleId)?.name,
						value: roleId
					}))
					.filter((res) => res.name.includes(value.toString()));
				break;
			}
			case 'member': {
				const currentMembers = guildInform.adminMember;

				filter = currentMembers
					.map((memberId) => ({
						name: interaction.guild.members.cache.get(memberId)?.displayName,
						value: memberId
					}))
					.filter((res) => res.name.includes(value.toString()));
				break;
			}
			case 'command': {
				const currentCommands = guildInform.adminCommand;

				filter = currentCommands
					.filter((command) => command.includes(value.toString()))
					.map((command) => ({
						name: command,
						value: command
					}));
				break;
			}
		}
		if (filter.length === 0) return interaction.respond([]);
		else return interaction.respond(filter.slice(0, NUMBER.AUTOCOMPLETE_OPTION_LENGTH));
	}
});
