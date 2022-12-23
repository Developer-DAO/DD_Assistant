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

export interface GetNextBirthday {
	errorFlag: boolean;
	errorMsg?: string;
	birthday?: number;
}
