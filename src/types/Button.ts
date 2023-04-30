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
	ConfirmMentorEffort = 'confirm',
	MentorDataShare = 'mentor_data_share',
	LeaderboardStatistics = 'leaderboard_statistics'
}

export enum ButtonCollectorCustomId {
	Next = 'next',
	Previous = 'previous',
	First = 'first',
	Last = 'last',
	PairConfirm = 'pair_confirm',
	MentorDataShareChange = 'mentor_data_share_change',
	ConfirmEffortYes = 'confirm_effort_yes',
	ConfirmEffortMore = 'confirm_effort_more',
	ConfirmEffortLess = 'confirm_effort_less',
	ConfirmEffortMessage = 'confirm_effort_message'
}
export interface ButtonType {
	customIds: Array<ButtonCustomIdEnum>;
	execute: RunFunction;
}
