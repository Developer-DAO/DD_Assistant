export interface parentChannelInform {
	parentId: string;
	parentName: string;
}

export interface awaitWrapSendRequestReturnValue {
	error: boolean;
	channelId: string;
	createTimestamp?: string;
	messageId?: string;
}
