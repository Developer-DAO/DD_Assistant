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
type buttonCustomId = 'end' | 'schedule' | 'talk' | 'instruction' | 'talk_yes' | 'talk_no';
export interface ButtonType {
	customIds: Array<buttonCustomId>;
	execute: RunFunction;
}
