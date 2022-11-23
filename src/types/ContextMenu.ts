import {
	ApplicationCommandType,
	GuildMember,
	Message,
	MessageApplicationCommandData,
	MessageContextMenuCommandInteraction,
	PermissionResolvable,
	UserApplicationCommandData,
	UserContextMenuCommandInteraction
} from 'discord.js';

export interface ExtendedUserContextMenuInteraction extends UserContextMenuCommandInteraction {
	targetMember: GuildMember;
}

export interface ExtendedMessageContextMenuInteraction
	extends MessageContextMenuCommandInteraction {
	targetMessage: Message;
}

interface MessageContextMenuCommandRunOption {
	interaction: ExtendedMessageContextMenuInteraction;
}

interface UserContextMenuCommandRunOption {
	interaction: ExtendedUserContextMenuInteraction;
}

type MessageContextMenuRunFunction = (options: MessageContextMenuCommandRunOption) => any;
type UserContextMenuRunFunction = (options: UserContextMenuCommandRunOption) => any;

type ContextMenuNameEnum = 'Grab Onboarding Call' | 'Grab Vibes Call';
export type UserContextMenuType = {
	userPermissions?: PermissionResolvable[];
	execute: UserContextMenuRunFunction;
	name: ContextMenuNameEnum;
	type: ApplicationCommandType.User;
} & UserApplicationCommandData;

export type MessageContextMenuType = {
	userPermissions?: PermissionResolvable[];
	execute: MessageContextMenuRunFunction;
	name: ContextMenuNameEnum;
	type: ApplicationCommandType.Message
} & MessageApplicationCommandData;
