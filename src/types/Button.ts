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
export enum ButtonCustomIdEnum {
	GetSchdule = 'schedule',
	CreateOnboardingThread = 'talk',
	SendNotificationToChannel = 'send',
	DeleteChannelFromScanResult = 'delete',
	EndTownHall = 'end',
	GetTHAttenderNumber = 'number',
	ClaimMentorEffort = 'claim',
	ConfirmMentorEffort = 'confirm'
}

export enum ButtonCollectorCustomId {
	Next = 'next',
	Previous = 'previous',
	First = 'first',
	Last = 'last',
	PairConfirm = 'pair_confirm'
}
export interface ButtonType {
	customIds: Array<ButtonCustomIdEnum>;
	execute: RunFunction;
}
