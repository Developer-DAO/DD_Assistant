import { ChannelInform, Guilds } from '@prisma/client';
type Maybe<T> = T | null;

export interface CacheType {
	VoiceContext: VoiceContextCache;
	Guild: GuildCache;
	ChannelScan: ChannelScanCache;
	StatusLock: StatusLockCache;
}

export interface StatusLock {
	scanStatus: boolean;
	archiveStatus: boolean;
	broadcastStatus: boolean;
}

export interface MemberVoiceInform {
	[memberId: string]: {
		timestamp: number;
		name: string;
	};
}

export interface VoiceContextInform {
	attendees: Maybe<MemberVoiceInform>;
	messageLink: Maybe<string>;
	hostId: Maybe<string>;
	channelId: Maybe<string>;
	duration: Maybe<number>;
}

export interface GuildChannelScan {
	[parentId: string]: {
		parentName: string;
		channels: ChannelInformCache;
	};
}

type GuildCache = Record<string, GuildInform>;
export type ChannelScanCache = Record<string, GuildChannelScan>;
export type PartialChannelInform = Omit<ChannelInform, 'channelId'>;
export type ChannelInformCache = Record<string, PartialChannelInform>;
export type GuildInform = Omit<Guilds, 'discordId'>;
export type StatusLockCache = Record<string, StatusLock>;
export type VoiceContextCache = Record<string, VoiceContextInform>

export const MYNULL = '';
