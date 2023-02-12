/* eslint-disable no-unused-vars */
import {
	ApplicationCommandType,
	ChatInputApplicationCommandData,
	CommandInteraction,
	CommandInteractionOptionResolver,
	GuildMember,
	PermissionResolvable
} from 'discord.js';

import { MyClient } from '../structures/Client';

export interface ExtendedCommandInteration extends CommandInteraction {
	member: GuildMember;
	commandName: CommandNameEmun;
}

interface CommandRunOptions {
	client: MyClient;
	interaction: ExtendedCommandInteration;
	args: CommandInteractionOptionResolver;
}

type RunFunction = (options: CommandRunOptions) => any;
export enum CommandNameEmun {
	Devdao = 'devdao',
	Guild = 'guild',
	Townhall = 'townhall',
	Birthday = 'birthday',
	Scan = 'scan',
	Collect = 'collect',
	Mentorship = 'mentorship',
	Hashnode_sub = 'hashnode_sub',
	Hashnode_unsub = 'hashnode_unsub',
	Contact = 'contact'
}
export type CommandType = {
	name: CommandNameEmun;
	userPermissions?: PermissionResolvable[];
	execute: RunFunction;
	type: ApplicationCommandType.ChatInput;
} & ChatInputApplicationCommandData;
