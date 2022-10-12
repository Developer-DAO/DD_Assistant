import {
	ContextMenuCommandInteraction,
	MessageApplicationCommandData,
	PermissionResolvable,
	UserApplicationCommandData
} from 'discord.js';
import { MyClient } from '../structures/Client';

interface CommandRunOptions {
	client: MyClient;
	interaction: ContextMenuCommandInteraction;
}

type RunFunction = (options: CommandRunOptions) => any;

export type ContextMenuType = {
	userPermissions?: PermissionResolvable[];
	execute: RunFunction;
} & (UserApplicationCommandData | MessageApplicationCommandData);
