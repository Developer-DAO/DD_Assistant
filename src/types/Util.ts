/* eslint-disable no-unused-vars */
export interface parentChannelInform {
	parentId: string;
	parentName: string;
}

export interface awaitWrapSendRequestReturnValue {
	error: boolean;
	channelId: string;
	createdTimestamp?: string;
	messageId?: string;
}

export enum CallType {
	ONBOARDING,
	WOMENVIBES
}
