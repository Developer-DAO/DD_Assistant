/* eslint-disable no-unused-vars */
import { ButtonInteraction, GuildMember, Message } from 'discord.js';

import { MyClient } from '../structures/Client';

export interface ExtendedButtonInteraction extends ButtonInteraction {
	member: GuildMember;
	message: Message;
}

interface ButtonRunOptions {
	client: MyClient;
	interaction: ExtendedButtonInteraction;
}

type RunFunction = (options: ButtonRunOptions) => any;
type ButtonCustomId =
	| 'end'
	| 'schedule'
	| 'talk'
	| 'instruction'
	| 'talk_yes'
	| 'talk_no'
	| 'send'
	| 'delete';
export enum ButtonCollectorCustomId {
	Next = 'next',
	Previous = 'previous',
	First = 'first',
	Last = 'last',
}
export interface ButtonType {
	customIds: Array<ButtonCustomId>;
	execute: RunFunction;
}
