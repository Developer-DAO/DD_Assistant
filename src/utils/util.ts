import { sprintf } from 'sprintf-js';
import { ERROR_REPLY, NUMBER, STICKYMSG } from './const';
import _ from 'lodash';
import { TimeOutError } from './error';
import { GuildInform } from '../types/Cache';
import { APIEmbedField, PermissionFlagsBits, TextChannel } from 'discord.js';
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
