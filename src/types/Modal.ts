/* eslint-disable no-unused-vars */
import { GuildMember, ModalSubmitInteraction } from 'discord.js';

import { MyClient } from '../structures/Client';

export interface ExtendedModalSubmitInteraction extends ModalSubmitInteraction {
	member: GuildMember;
}

interface ModalRunOptions {
	client: MyClient;
	interaction: ExtendedModalSubmitInteraction;
}

type RunFunction = (options: ModalRunOptions) => any;
export enum ModalCustomIdEnum {
	Contact = 'contact'
}

export enum ModalCollectorCustomIdEnum {
	ClaimMentorEffort = 'claim_effort',
	SendMessageToMentor = 'send_message_to_mentor',
}

export interface ModalType {
	customId: ModalCustomIdEnum;
	execute: RunFunction;
}
