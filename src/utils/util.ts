import { sprintf } from 'sprintf-js';
import { COMMAND_CONTENT, ERROR_REPLY, MONTH, NUMBER, STICKYMSG, WEEK } from './const';
import _ from 'lodash';
import { TimeOutError } from './error';
import { GuildInform } from '../types/Cache';
import { APIEmbedField, EmbedBuilder, PermissionFlagsBits, TextChannel } from 'discord.js';
import { myCache } from '../structures/Cache';
export interface awaitWrapType<T> {
	result: T | null;
	error: any | null;
}

export async function awaitWrap<T>(promise: Promise<T>): Promise<awaitWrapType<T>> {
	return promise
		.then((data) => {
			return {
				result: data,
				error: null
			};
		})
		.catch((error) => {
			return {
				result: null,
				error: error?.message
			};
		});
}

export async function awaitWrapWithTimeout<T>(
	promise: Promise<T>,
	ms = NUMBER.AWAIT_TIMEOUT
): Promise<awaitWrapType<T>> {
	const timeout = new Promise<never>((_, reject) => {
		setTimeout(() => {
			reject(new TimeOutError());
		}, ms);
	});
	return Promise.race([promise, timeout])
		.then((data) => {
			return {
				result: data,
				error: null
			};
		})
		.catch((error) => {
			return {
				result: null,
				error: error
			};
		});
}

export function getErrorReply(errorInform: {
	commandName: string;
	subCommandName?: string;
	errorMessage: string;
}) {
	const { commandName, subCommandName, errorMessage } = errorInform;
	if (subCommandName) {
		return sprintf(ERROR_REPLY.GRAPHQL, {
			action: `${commandName} ${subCommandName}`,
			errorMessage: `\`${errorMessage}\``
		});
	} else {
		return sprintf(ERROR_REPLY.GRAPHQL, {
			action: `${commandName}`,
			errorMessage: `\`${errorMessage}\``
		});
	}
}

export function getCurrentTimeMin() {
	return Math.floor(new Date().getTime() / 1000);
}

export function readGuildInform(guildInform: GuildInform, guildId: string): APIEmbedField[] {
	interface ChannelInform {
		channelName: string;
		channelValue: string;
	}
	let channelInform: ChannelInform = {
		channelName: '',
		channelValue: ''
	};
	channelInform = Object.keys(guildInform.channels).reduce<ChannelInform>(
		(pre: ChannelInform, cur: string) => {
			pre.channelName += `> **${cur.toLocaleUpperCase()} CHANNEL**\n`;
			const channel = guildInform.channels[cur];
			if (channel) {
				pre.channelValue += `> <#${channel}>\n`;
			} else {
				pre.channelValue += '> -\n';
			}
			return pre;
		},
		channelInform
	);

	let adminInform = {
		adminRole: '> -',
		adminMember: '> -',
		adminCommand: '> -'
	};

	const { adminCommand, adminMember, adminRole } = guildInform;
	if (adminCommand.length !== 0) {
		adminInform.adminCommand = adminCommand.reduce((pre, cur) => {
			return pre + `> ${cur}\n`;
		}, '');
	}
	if (adminMember.length !== 0) {
		adminInform.adminMember = adminMember.reduce((pre, cur) => {
			return pre + `> <@${cur}>\n`;
		}, '');
	}
	if (adminRole.length !== 0) {
		adminInform.adminRole = adminRole.reduce((pre, cur) => {
			if (cur === guildId) {
				return pre + `> \`@everyone\`\n`;
			} else {
				return pre + `> <@&${cur}>\n`;
			}
		}, '');
	}

	return [
		{
			name: 'Admin Role',
			value: adminInform.adminRole,
			inline: true
		},
		{
			name: 'Admin Member',
			value: adminInform.adminMember,
			inline: true
		},
		{
			name: 'Admin Command',
			value: adminInform.adminCommand,
			inline: true
		},
		{
			name: 'Channel Configuration',
			value: channelInform.channelName,
			inline: true
		},
		{
			name: 'Target Channel',
			value: channelInform.channelValue,
			inline: true
		}
	];
}

export function checkChannelPermission(channel: TextChannel, userId: string) {
	if (!channel.permissionsFor(userId, true).has([PermissionFlagsBits.ViewChannel])) {
		return 'Missing **VIEW CHANNEL** access.';
	}
	if (!channel.permissionsFor(userId, true).has([PermissionFlagsBits.SendMessages])) {
		return 'Missing **SEND MESSAGES** access.';
	}
	return false;
}

export function checkIntroductionChannelPermission(channel: TextChannel, userId: string) {
	if (!channel.permissionsFor(userId, true).has([PermissionFlagsBits.ViewChannel])) {
		return 'Missing **VIEW CHANNEL** access.';
	}
	if (!channel.permissionsFor(userId, true).has([PermissionFlagsBits.SendMessages])) {
		return 'Missing **SEND MESSAGES** access.';
	}
	if (!channel.permissionsFor(userId, true).has([PermissionFlagsBits.ReadMessageHistory])) {
		return 'Missing **READ MESSAGE HISTORY** access.';
	}
	if (!channel.permissionsFor(userId, true).has([PermissionFlagsBits.CreatePublicThreads])) {
		return 'Missing **CREATE PUBLIC THREADS** access.';
	}
	if (!channel.permissionsFor(userId, true).has([PermissionFlagsBits.SendMessagesInThreads])) {
		return 'Missing **SEND MESSAGES IN THREAD** access.';
	}
	return false;
}

export function checkTownHallChannelPermission(channel: TextChannel, userId: string) {
	if (!channel.permissionsFor(userId, true).has([PermissionFlagsBits.Connect])) {
		return 'Missing **CONNECT** access.';
	}
	if (!channel.permissionsFor(userId, true).has([PermissionFlagsBits.ViewChannel])) {
		return 'Missing **VIEW CHANNEL** access.';
	}
	if (!channel.permissionsFor(userId, true).has([PermissionFlagsBits.SendMessages])) {
		return 'Missing **SEND MESSAGES** access.';
	}
	return false;
}

export async function stickyMsgHandler(
	curChannel: TextChannel,
	botId: string,
	preChannel?: TextChannel
) {
	if (checkIntroductionChannelPermission(curChannel, botId)) return;
	if (typeof preChannel !== 'undefined') {
		if (checkIntroductionChannelPermission(preChannel, botId)) return;
		(await preChannel.messages.fetch({ limit: 25 }))
			.filter((msg) => msg?.author?.bot && msg?.author?.id === botId && msg?.deletable)
			.forEach((msg) => msg.delete());
	}
	if (checkIntroductionChannelPermission(curChannel, botId)) return;
	(await curChannel.messages.fetch({ limit: 25 }))
		.filter((msg) => msg?.author?.bot && msg?.author?.id === botId && msg?.deletable)
		.forEach((msg) => msg.delete());
	return curChannel.send(STICKYMSG);
}

export function fetchOnboardingSchedule(guildId: string) {
	let description: string;
	const guildInform = myCache.myGet('Guild')[guildId];
	if (guildInform.onboardSchedule.length === 0) {
		description = COMMAND_CONTENT.ONBOARDING_END;
	} else {
		const onboardChannelContent = guildInform.channels.onboardChannel
			? ` in <#${guildInform.channels.onboardChannel}>`
			: '';
		const time = Math.floor(new Date().getTime() / 1000);
		description = guildInform.onboardSchedule
			.sort((a, b) => Number(a.timestamp) - Number(b.timestamp))
			.map((onboardInform, index) => {
				const timestamp = Number(onboardInform.timestamp);
				if (time > timestamp && time < timestamp + NUMBER.ONBOARDING_DURATION) {
					return sprintf(COMMAND_CONTENT.ONBOARDING_GOINGON, {
						...onboardInform,
						index: index + 1,
						channelInform: onboardChannelContent
					});
				}
				return sprintf(COMMAND_CONTENT.ONBOARDING, {
					...onboardInform,
					index: index + 1
				});
			})
			.toString()
			.replace(/,/g, '');
	}

	return new EmbedBuilder().setTitle('Onboarding Schedule').setDescription(description);
}

export function convertTimeStamp(timestampInSec) {
	const timestampInMiliSec = timestampInSec * 1000;
	const date = new Date(timestampInMiliSec);
	return sprintf('%(week)s, %(month)s %(day)d, %(year)d %(hour)d:%(min)d', {
		week: WEEK[date.getDay()],
		month: MONTH[date.getUTCMonth()],
		day: date.getUTCDate(),
		year: date.getUTCFullYear(),
		hour: date.getUTCHours(),
		min: date.getUTCMinutes()
	});
}
