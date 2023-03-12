import {
	ChannelInform,
	Epoch,
	Guilds,
	HashNodeSub,
	Mentorship,
	StickyRecord
} from '@prisma/client';
type Maybe<T> = T | null;

export interface CacheType {
	VoiceContext: VoiceContextCache;
	Guild: GuildCache;
	ChannelScan: ChannelScanCache;
	HashNodeSub: HashNodeSubCache;
	ContactModalCache: ModalCache;
	MentorshipConfig: MentorshipCache;
	CurrentEpoch: EpochCache;
	StickyInform: StickyInformCache;
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
	messageId: Maybe<string>;
}

export interface GuildChannelScan {
	[parentId: string]: {
		parentName: string;
		channels: ChannelInformCache;
	};
}

export interface ModalInform {
	id: string;
}

export type HashNodeSubInform = Pick<HashNodeSub, 'latestCuid' | 'id' | 'hashNodeUserName'>;

type GuildCache = Record<string, GuildInform>;
export type ChannelScanCache = Record<string, GuildChannelScan>;
export type PartialChannelInform = Omit<ChannelInform, 'channelId'>;
export type ChannelInformCache = Record<string, PartialChannelInform>;
export type GuildInform = Omit<Guilds, 'discordId'>;
export type VoiceContextCache = Record<string, VoiceContextInform>;
export type HashNodeSubCache = Record<string, HashNodeSubInform>;
export type ModalCache = Record<string, ModalInform>;
export type MentorshipCache = Record<string, Mentorship>;
export type EpochCache = Record<string, Epoch>;
type ExtractProperty<T, U extends keyof T> = {
	[K in keyof T]: K extends U ? T[K] : never;
}[keyof T];
type ChannelId = ExtractProperty<StickyRecord, 'channelId'>;
export type StickyInformCache = Record<ChannelId, StickyRecord>;

export const MYNULL = '';
