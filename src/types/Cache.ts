import { ChannelInform, Guilds, HashNodeSub, Mentorship } from '@prisma/client';
type Maybe<T> = T | null;

export interface CacheType {
	VoiceContext: VoiceContextCache;
	Guild: GuildCache;
	ChannelScan: ChannelScanCache;
	HashNodeSub: HashNodeSubCache;
	ContactModalCache: ModalCache;
	MentorshipConfig: MentorshipCache;
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

export const MYNULL = '';
