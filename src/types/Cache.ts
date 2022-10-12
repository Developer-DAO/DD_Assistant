import { ChannelScan, Guilds } from '@prisma/client';
type Maybe<T> = T | null;

export interface CacheType {
	VoiceContext: VoiceContextCache;
	Guild: GuildCache;
	ChannelScan: ChannelScanCache;
}

export interface MemberVoiceInform {
	[memberId: string]: {
		timestamp: number;
		name: string;
	};
}

export interface VoiceContextCache {
	attendees: Maybe<MemberVoiceInform>;
	messageLink: Maybe<string>;
	hostId: Maybe<string>;
	channelId: Maybe<string>;
	duration: Maybe<number>;
}

type GuildCache = Record<string, GuildInform>;
type ChannelScanCache = Record<string, GuildChannelScan>;
export type GuildInform = Omit<Guilds, 'discordId'>;
export type GuildChannelScan = Omit<ChannelScan, 'discordId'>;

export const MYNULL = '';
