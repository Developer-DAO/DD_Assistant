import {
	Category,
	ChannelInform,
	ChannelScan,
	ChannelSetting,
	OnboardInform
} from '@prisma/client';
import {
	APIEmbedField,
	CategoryChannel,
	ChannelType,
	Collection,
	EmbedBuilder,
	Guild,
	GuildChannelManager,
	Message,
	NonThreadGuildBasedChannel,
	PermissionFlagsBits,
	TextChannel,
	VoiceChannel
} from 'discord.js';
import _ from 'lodash';
import { sprintf } from 'sprintf-js';

import { prisma } from '../prisma/prisma';
import { myCache } from '../structures/Cache';
import {
	ChannelInformCache,
	ChannelScanCache,
	GuildChannelScan,
	GuildInform
} from '../types/Cache';
import { awaitWrapSendRequestReturnValue, CallType, parentChannelInform } from '../types/Util';
import {
	COMMAND_CONTENT,
	defaultPartialChannelInform,
	ERROR_REPLY,
	MONTH,
	NUMBER,
	STICKYMSG,
	WEEK,
	WOMENSTICKYMSG
} from './const';
import { TimeOutError } from './error';
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

export async function awaitWrapSendRequest(
	promise: Promise<Message>,
	channelId: string
): Promise<awaitWrapSendRequestReturnValue> {
	return promise
		.then((data) => {
			return {
				error: false,
				createdTimestamp: Math.floor(data.createdTimestamp / 1000).toString(),
				messageId: data.id,
				channelId: channelId
			};
		})
		.catch((err) => {
			return {
				error: true,
				channelId: channelId
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
		(pre: ChannelInform, cur: keyof ChannelSetting) => {
			if (cur === 'archiveCategoryChannels') return pre;
			pre.channelName += `> **${cur.toLocaleUpperCase()}**\n`;
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

	const adminInform = {
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

	let excludedCategoryChannelsContent = '> -';
	const excludedCategoryChannels = guildInform.channels.archiveCategoryChannels;

	if (excludedCategoryChannels.length !== 0) {
		excludedCategoryChannelsContent = guildInform.channels.archiveCategoryChannels.reduce(
			(pre, cur) => {
				return pre + `> <#${cur}>\n`;
			},
			''
		);
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
		},
		{
			name: 'Excluded Category Channel',
			value: excludedCategoryChannelsContent,
			inline: false
		}
	];
}

export function checkChannelPermission(channel: TextChannel, userId: string) {
	if (!channel.permissionsFor(userId, true).has([PermissionFlagsBits.ViewChannel])) {
		return 'Missing **VIEW CHANNEL** access';
	}
	if (!channel.permissionsFor(userId, true).has([PermissionFlagsBits.SendMessages])) {
		return 'Missing **SEND MESSAGES** access';
	}
	return false;
}

export function checkVoiceChannelPermission(channel: VoiceChannel, userId: string) {
	if (!channel.permissionsFor(userId, true).has([PermissionFlagsBits.ViewChannel])) {
		return 'Missing **VIEW CHANNEL** access';
	}
	if (!channel.permissionsFor(userId, true).has([PermissionFlagsBits.ViewChannel])) {
		return 'Missing **VIEW CHANNEL** access';
	}
	if (!channel.permissionsFor(userId, true).has([PermissionFlagsBits.SendMessages])) {
		return 'Missing **SEND MESSAGES** access';
	}
	return false;
}

export function checkToBeArchivedChannelPermission(channel: TextChannel, userId: string) {
	if (!channel.permissionsFor(userId, true).has([PermissionFlagsBits.ViewChannel])) {
		return 'Missing **VIEW CHANNEL** access';
	}
	if (!channel.permissionsFor(userId, true).has([PermissionFlagsBits.SendMessages])) {
		return 'Missing **SEND MESSAGES** access';
	}
	if (!channel.permissionsFor(userId, true).has([PermissionFlagsBits.ManageChannels])) {
		return 'Missing **MANAGE CHANNELS** access';
	}
	return false;
}

export function checkIntroductionChannelPermission(channel: TextChannel, userId: string) {
	if (!channel.permissionsFor(userId, true).has([PermissionFlagsBits.ViewChannel])) {
		return 'Missing **VIEW CHANNEL** access';
	}
	if (!channel.permissionsFor(userId, true).has([PermissionFlagsBits.SendMessages])) {
		return 'Missing **SEND MESSAGES** access';
	}
	if (!channel.permissionsFor(userId, true).has([PermissionFlagsBits.ReadMessageHistory])) {
		return 'Missing **READ MESSAGE HISTORY** access';
	}
	if (!channel.permissionsFor(userId, true).has([PermissionFlagsBits.CreatePublicThreads])) {
		return 'Missing **CREATE PUBLIC THREADS** access';
	}
	if (!channel.permissionsFor(userId, true).has([PermissionFlagsBits.SendMessagesInThreads])) {
		return 'Missing **SEND MESSAGES IN THREAD** access';
	}
	return false;
}

export function checkTownHallChannelPermission(channel: TextChannel, userId: string) {
	if (!channel.permissionsFor(userId, true).has([PermissionFlagsBits.Connect])) {
		return 'Missing **CONNECT** access';
	}
	if (!channel.permissionsFor(userId, true).has([PermissionFlagsBits.ViewChannel])) {
		return 'Missing **VIEW CHANNEL** access';
	}
	if (!channel.permissionsFor(userId, true).has([PermissionFlagsBits.SendMessages])) {
		return 'Missing **SEND MESSAGES** access';
	}
	return false;
}

export function getNotificationMsg(channelId: string, timestamp: number) {
	return sprintf(COMMAND_CONTENT.NOTIFICATION_MSG, {
		channelId: channelId,
		timestamp: timestamp.toString()
	});
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
			.filter((msg) => msg?.author?.bot && msg?.author?.id === botId && msg.deletable)
			.forEach((msg) => msg.delete());
	}
	if (checkIntroductionChannelPermission(curChannel, botId)) return;
	(await curChannel.messages.fetch({ limit: 25 }))
		.filter((msg) => msg?.author?.bot && msg?.author?.id === botId && msg.deletable)
		.forEach((msg) => msg.delete());
	const guildId = curChannel.guildId;
	const { introductionChannel } = myCache.myGet('Guild')[guildId].channels;

	if (curChannel.id === introductionChannel) {
		return curChannel.send(STICKYMSG);
	} else {
		return curChannel.send(WOMENSTICKYMSG);
	}
}

export async function fetchCallSchedule(guildId: string, type: CallType) {
	const { womenVibesSchedule, onboardSchedule, channels } = myCache.myGet('Guild')[guildId];
	let callSchedule: Array<OnboardInform> = [];
	let callEnd: string;
	let callGoingOn: string;
	let callToBeHosted: string;
	let callVoiceChannel: string;
	let prismaPropertyName: string;
	let embedTitle: string;

	if (type === CallType.ONBOARDING) {
		callSchedule = onboardSchedule;
		callEnd = COMMAND_CONTENT.ONBOARDING_END;
		callGoingOn = COMMAND_CONTENT.ONBOARDING_GOINGON;
		callToBeHosted = COMMAND_CONTENT.ONBOARDING;
		callVoiceChannel = channels.onboardChannel;
		prismaPropertyName = 'onboardSchedule';
		embedTitle = 'Onboarding Schedule';
	} else {
		callSchedule = womenVibesSchedule;
		callEnd = COMMAND_CONTENT.WOMENVIBES_END;
		callGoingOn = COMMAND_CONTENT.WOMENVIBES_GOINGON;
		callToBeHosted = COMMAND_CONTENT.WOMENVIBES;
		callVoiceChannel = channels.womenVibesChannel;
		prismaPropertyName = 'womenVibesSchedule';
		embedTitle = 'Women Vibes Schedule';
	}
	let description = '';

	if (callSchedule.length === 0) {
		description = callEnd;
	} else {
		const onboardChannelContent = callVoiceChannel ? ` in <#${callVoiceChannel}>` : '';
		const time = Math.floor(new Date().getTime() / 1000);
		const toBeUpdatedSchedule = [...callSchedule];

		callSchedule
			.sort((a, b) => Number(a.timestamp) - Number(b.timestamp))
			.forEach((onboardInform, index) => {
				const timestamp = Number(onboardInform.timestamp);
				const endTimestamp = timestamp + NUMBER.ONBOARDING_DURATION;

				if (time > endTimestamp) {
					toBeUpdatedSchedule.splice(index, 1);
					return;
				}

				if (time > timestamp && time < timestamp + NUMBER.ONBOARDING_DURATION) {
					description += sprintf(callGoingOn, {
						...onboardInform,
						index: index + 1,
						channelInform: onboardChannelContent
					});
					return;
				}
				description += sprintf(callToBeHosted, {
					...onboardInform,
					index: index + 1
				});
			});

		if (toBeUpdatedSchedule.length !== callSchedule.length) {
			await prisma.guilds.update({
				where: {
					discordId: guildId
				},
				data: {
					[prismaPropertyName]: toBeUpdatedSchedule
				}
			});
			myCache.mySet('Guild', {
				...myCache.myGet('Guild'),
				[guildId]: {
					...myCache.myGet('Guild')[guildId],
					[prismaPropertyName]: toBeUpdatedSchedule
				}
			});
		}
		if (!description) {
			description = callEnd;
		}
	}

	return new EmbedBuilder().setTitle(embedTitle).setDescription(description);
}

export async function searchEvent(
	embedFields: Array<APIEmbedField>,
	guildId: string,
	type: CallType
): Promise<string | false> {
	const currentTimeStamp = Math.floor(new Date().getTime() / 1000);
	const onboardInformArray: Array<OnboardInform> = [];
	const guildInform = myCache.myGet('Guild')[guildId];
	let currentCallSchduleTimestampArray: string[];
	let prismaPropertyName: string;

	let targetEventName: string;

	if (type === CallType.ONBOARDING) {
		targetEventName = COMMAND_CONTENT.ONBOARDING_CALL_EVENT_NAME;
		currentCallSchduleTimestampArray = guildInform.onboardSchedule.map(
			(schedule) => schedule.timestamp
		);
		prismaPropertyName = 'onboardSchedule';
	} else {
		targetEventName = COMMAND_CONTENT.WOMENVIBES_CALL_EVENT_NAME;
		currentCallSchduleTimestampArray = guildInform.womenVibesSchedule.map(
			(schedule) => schedule.timestamp
		);
		prismaPropertyName = 'womenVibesSchedule';
	}

	embedFields.forEach((field) => {
		const { value } = field;
		const eventIndex: Array<number> = [];

		value.match(/\[.+\]/g)?.filter((name, index) => {
			const eventName = name.slice(1, -1).trim();

			if (eventName === targetEventName) {
				eventIndex.push(index);
				return true;
			} else return false;
		});
		if (eventIndex.length === 0) return;
		const matchEventTimeStamps = value.match(/<t:\d+:R>/g);
		const matchEventLinks = value.match(/(https:\/\/discord\.com\/channels\/\d+\/\d+\/\d+)/g);

		eventIndex.forEach((index) => {
			const timestamp = matchEventTimeStamps[index].slice(3, -3);

			if (currentCallSchduleTimestampArray.includes(timestamp)) return;
			if (currentTimeStamp > Number(timestamp)) return;
			onboardInformArray.push({
				timestamp: timestamp,
				eventLink: matchEventLinks[index]
			});
		});
	});
	console.log(onboardInformArray);
	if (onboardInformArray.length === 0) {
		return `I cannot find \`${targetEventName}\` event, they are outdated, or you have added them.`;
	}

	try {
		await prisma.guilds.update({
			where: {
				discordId: guildId
			},
			data: {
				[prismaPropertyName]: onboardInformArray
			}
		});
	} catch (error) {
		return 'Error occured when updating the database, please try again.';
	}
	const guildInformCache = myCache.myGet('Guild')[guildId];

	myCache.mySet('Guild', {
		...myCache.myGet('Guild'),
		[guildId]: {
			...guildInformCache,
			[prismaPropertyName]: onboardInformArray
		}
	});

	return false;
}

export function convertTimeStamp(timestampInSec: number) {
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

export function getParentInform(parentId: string, parentObj: CategoryChannel): parentChannelInform {
	const id = parentId ?? COMMAND_CONTENT.CHANNEL_WITHOUT_PARENT_PARENTID;
	const name =
		id !== COMMAND_CONTENT.CHANNEL_WITHOUT_PARENT_PARENTID
			? parentObj.name
			: COMMAND_CONTENT.CHANNEL_WITHOUT_PARENT_PARENTNAME;

	return {
		parentId: id,
		parentName: name
	};
}

export async function scanChannel(
	guild: Guild,
	archiveChannels: string[]
): Promise<GuildChannelScan> {
	let channels = await guild.channels.fetch();
	const scanResult: GuildChannelScan = {};
	const guildId = guild.id;
	const preivosScanResult = myCache.myGet('ChannelScan')[guildId];

	channels = channels.filter(
		(channel) =>
			channel.type === ChannelType.GuildText &&
			!channel.topic &&
			!archiveChannels.includes(channel.parentId)
	);

	const fetchMsgPromise = [];

	Array.from(channels.values()).forEach((channel: TextChannel) => {
		const { parentId, parentName } = getParentInform(channel.parentId, channel.parent);
		const channelId = channel.id;
		const previousChannelInform = preivosScanResult?.[parentId]?.channels?.[channel.id];

		if (parentId in scanResult) {
			scanResult[parentId].channels[channelId] = {
				...defaultPartialChannelInform,
				channelName: channel.name
			};
		} else {
			scanResult[parentId] = {
				parentName: parentName,
				channels: {
					[channelId]: {
						...defaultPartialChannelInform,
						channelName: channel.name
					}
				}
			};
		}

		if (previousChannelInform?.status) {
			scanResult[parentId].channels[channelId] = previousChannelInform;
		}

		fetchMsgPromise.push(
			awaitWrap(
				channel.messages.fetch({
					limit: 1
				})
			)
		);
	});
	const results: Array<awaitWrapType<Collection<string, Message>>> = await Promise.all(
		fetchMsgPromise
	);

	results.forEach((result) => {
		const { result: messages } = result;

		if (messages.size !== 0) {
			const { createdTimestamp } = messages.first();
			const lastMsgTime = Math.floor(createdTimestamp / 1000);
			const channel = messages.first().channel as TextChannel;
			const { parentId } = getParentInform(channel.parentId, channel.parent);

			scanResult[parentId].channels[channel.id].lastMsgTimestamp = lastMsgTime.toString();
		}
	});
	return scanResult;
}

export function deSerializeChannelScan(scanResult: ChannelScan): ChannelScanCache {
	const result: ChannelScanCache = {};

	result[scanResult.discordId] = {};
	scanResult.categories.forEach((category) => {
		const channelInform: ChannelInformCache = {};

		category.channels.forEach((channel) => {
			channelInform[channel.channelId] = {
				channelName: channel.channelName,
				lastMsgTimestamp: channel.lastMsgTimestamp,
				archiveTimestamp: channel.archiveTimestamp,
				messageId: channel.messageId,
				status: channel.status
			};
		});
		result[scanResult.discordId][category.parentId] = {
			parentName: category.parentName,
			channels: channelInform
		};
	});
	return result;
}

export function serializeChannelScan(scanResult: ChannelScanCache, guildId: string): ChannelScan {
	const guildChannelScan = scanResult[guildId];
	const categories: Array<Category> = [];

	Object.keys(guildChannelScan).forEach((parentId) => {
		const { parentName, channels } = guildChannelScan[parentId];
		const channelInformArray: Array<ChannelInform> = [];

		Object.keys(channels).forEach((channelId) => {
			channelInformArray.push({
				...channels[channelId],
				channelId: channelId
			});
		});
		categories.push({
			channels: channelInformArray,
			parentId: parentId,
			parentName: parentName
		});
	});
	return {
		discordId: guildId,
		categories: categories
	};
}

export function embedFieldsFactory(channels: ChannelInformCache, guildId: string) {
	const channelFields = [];
	const lastMsgTimeFields = [];
	const statusFields = [];

	const limit = NUMBER.EMBED_CONTENT_LIMIT;
	const length = Object.keys(channels).length;
	let counter = 0;

	while (true) {
		let channelField = '';
		let lastMsgTimeField = '';
		let statusField = '';

		Object.keys(channels)
			.slice(counter, counter + limit)
			.forEach((channelId) => {
				channelField = channelField.concat(`> <#${channelId}>\n`);

				const lastTimestamp = channels[channelId].lastMsgTimestamp;

				if (lastTimestamp === defaultPartialChannelInform.lastMsgTimestamp) {
					lastMsgTimeField = lastMsgTimeField.concat('> `unfetchable`\n');
				} else {
					lastMsgTimeField = lastMsgTimeField.concat(`> <t:${lastTimestamp}:R>\n`);
				}

				if (channels[channelId].status) {
					const messageLink = sprintf(COMMAND_CONTENT.DISCORD_MSG, {
						guildId: guildId,
						channelId: channelId,
						messageId: channels[channelId].messageId
					});

					statusField = statusField.concat(
						`> [Archived](${messageLink}) <t:${channels[channelId].archiveTimestamp}:R>\n`
					);
				} else {
					statusField = statusField.concat('> `unsent`\n');
				}
			});

		channelFields.push(channelField);
		lastMsgTimeFields.push(lastMsgTimeField);
		statusFields.push(statusField);
		if (counter + limit >= length) break;
		counter += limit;
	}
	return {
		channelFields: channelFields,
		lastMsgTimeFields: lastMsgTimeFields,
		statusFields: statusFields
	};
}

export async function autoArchive(
	guildChannelManager: GuildChannelManager,
	guildId: string,
	botId: string
): Promise<{
	error: boolean;
	errorMessage?: string;
	embeds?: Array<EmbedBuilder>;
}> {
	// to-do archive channel permission checking
	const guildInform = myCache.myGet('Guild')[guildId];
	const { notificationChannel: notificationChannelId } = guildInform.channels;

	if (!notificationChannelId) {
		return {
			error: true,
			errorMessage: 'Please set up a notification channel first'
		};
	}
	const notificationChannel = guildChannelManager.cache.get(notificationChannelId) as TextChannel;

	if (!notificationChannel) {
		return {
			error: true,
			errorMessage: `Notification channel <#${notificationChannelId}> is unfetchable.`
		};
	}
	const { autoArchiveInform } = guildInform;
	const { archiveCategoryChannels } = guildInform.channels;

	let scanResult = myCache.myGet('ChannelScan')[guildId];
	const current = Math.floor(new Date().getTime() / 1000);

	type archiveInform = {
		parentId: string;
		channelId: string;
	};
	type successArchiveInform = archiveInform & {
		currentParentId: string;
	};

	const toBeArchived: Array<archiveInform> = [];

	Object.keys(scanResult).forEach((parentId) => {
		const { channels } = scanResult[parentId];

		toBeArchived.push(
			...Object.keys(channels)
				.filter(
					(channelId) =>
						channels[channelId].archiveTimestamp !== '0' &&
						current > Number(channels[channelId].archiveTimestamp)
				)
				.map((channelId) => ({
					parentId: parentId,
					channelId: channelId
				}))
		);
	});

	if (toBeArchived.length === 0) {
		return {
			error: true,
			errorMessage: 'No channel needs to be archived.'
		};
	}

	const { length } = toBeArchived;

	const limit = NUMBER.ARCHIVE_CHANNEL_CHILD_LIMIT;
	let counter = 0;
	const failChannels: Array<archiveInform> = [];
	const successChannels: Array<successArchiveInform> = [];

	while (true) {
		const latestAutoArchiveInform = _.last(autoArchiveInform);
		let remainingSpace: number;
		let targetArchieveChannelId: string;

		if (!latestAutoArchiveInform || latestAutoArchiveInform.remaining === 0) {
			const archiveChannel = await guildChannelManager.create({
				name: sprintf(
					COMMAND_CONTENT.ARCHIVE_CHANNEL_NAME_TEMPLATE,
					autoArchiveInform.length + 1
				),
				type: ChannelType.GuildCategory,
				permissionOverwrites: [
					{
						id: guildId,
						deny: [PermissionFlagsBits.ViewChannel]
					}
				]
			});

			autoArchiveInform.push({
				channelId: archiveChannel.id,
				remaining: limit
			});
			targetArchieveChannelId = archiveChannel.id;
			remainingSpace = limit;
		} else {
			targetArchieveChannelId = latestAutoArchiveInform.channelId;
			remainingSpace = latestAutoArchiveInform.remaining;
		}

		let moveCounter = 0;

		for (const { parentId, channelId } of toBeArchived.slice(
			counter,
			counter + remainingSpace
		)) {
			const channel = guildChannelManager.cache.get(channelId) as TextChannel;

			if (!channel) {
				failChannels.push({
					parentId: parentId,
					channelId: channelId
				});
				continue;
			}

			const permissionChecking = checkToBeArchivedChannelPermission(channel, botId);

			if (permissionChecking) {
				failChannels.push({
					parentId: parentId,
					channelId: channelId
				});
				continue;
			}
			// todo handle error correctly, maybe the lastest one has been deleted
			const categoryChannel = (await guildChannelManager.fetch(
				targetArchieveChannelId
			)) as CategoryChannel;

			await channel.setParent(categoryChannel, {
				lockPermissions: true,
				reason: 'Inactive Channel'
			});

			successChannels.push({
				parentId: parentId,
				channelId: channelId,
				currentParentId: targetArchieveChannelId
			});
			moveCounter++;
		}
		autoArchiveInform.splice(autoArchiveInform.length - 1, 1, {
			channelId: targetArchieveChannelId,
			remaining: remainingSpace - moveCounter
		});
		if (counter + remainingSpace > length) break;
		counter += remainingSpace;
	}

	const toBeCachedArchiveCategoryChannel = _.uniq([
		...archiveCategoryChannels,
		...autoArchiveInform.map(({ channelId }) => channelId)
	]);

	await prisma.guilds.update({
		where: {
			discordId: guildId
		},
		data: {
			autoArchiveInform: autoArchiveInform,
			channels: {
				...guildInform.channels,
				archiveCategoryChannels: toBeCachedArchiveCategoryChannel
			}
		}
	});

	myCache.mySet('Guild', {
		...myCache.myGet('Guild'),
		[guildId]: {
			...myCache.myGet('Guild')[guildId],
			channels: {
				...guildInform.channels,
				archiveCategoryChannels: toBeCachedArchiveCategoryChannel
			},
			autoArchiveInform: autoArchiveInform
		}
	});

	scanResult = myCache.myGet('ChannelScan')[guildId];
	successChannels.forEach(({ parentId, channelId }) => {
		delete scanResult[parentId].channels[channelId];
		// Only 'parentName' attribute
		if (Object.keys(scanResult[parentId].channels).length === 0) {
			delete scanResult[parentId];
		}
	});
	await prisma.channelScan.update({
		where: {
			discordId: guildId
		},
		data: {
			categories: serializeChannelScan(
				{
					[guildId]: scanResult
				},
				guildId
			).categories
		}
	});
	myCache.mySet('ChannelScan', {
		[guildId]: scanResult
	});

	let failChannelsField = '> -';
	let failChannelsParentsField = '> -';
	let successChannelsField = '> -';
	let successChannelsParentsField = '> -';
	let successChannelsPreviousParentsField = '> -';

	successChannels.forEach(({ parentId, channelId, currentParentId }, index) => {
		if (index === 0) {
			successChannelsField = '';
			successChannelsParentsField = '';
			successChannelsPreviousParentsField = '';
		}
		successChannelsField += `<#${channelId}>\n`;
		successChannelsParentsField += `<#${currentParentId}>\n`;
		successChannelsPreviousParentsField += `<#${parentId}>\n`;
	});
	failChannels.forEach(({ parentId, channelId }, index) => {
		if (index === 0) {
			failChannelsField = '';
			failChannelsParentsField = '';
		}
		failChannelsField += `<#${channelId}>\n`;
		failChannelsParentsField += `<#${parentId}>\n`;
	});
	return {
		error: false,
		embeds: [
			new EmbedBuilder().setTitle('Archive Success Report').addFields([
				{ name: 'Channel', value: successChannelsField, inline: true },
				{
					name: 'Current Parent',
					value: successChannelsParentsField,
					inline: true
				},
				{
					name: 'Previous Parent',
					value: successChannelsPreviousParentsField,
					inline: true
				}
			]),
			new EmbedBuilder().setTitle('Archive Fail Report').addFields([
				{ name: 'Channel', value: failChannelsField, inline: true },
				{ name: 'Current Parent', value: failChannelsParentsField, inline: true }
			])
		]
	};
}

export async function deleteChannelHandler(
	deletedChannel: NonThreadGuildBasedChannel,
	parentId: string,
	guildId: string
) {
	const scanResult = myCache.myGet('ChannelScan')[guildId];

	delete scanResult[parentId].channels[deletedChannel.id];
	if (Object.keys(scanResult[parentId].channels).length === 0) {
		delete scanResult[parentId];
	}
	await prisma.channelScan.update({
		where: {
			discordId: guildId
		},
		data: {
			categories: serializeChannelScan(
				{
					[guildId]: scanResult
				},
				guildId
			).categories
		}
	});
	myCache.mySet('ChannelScan', {
		...myCache.myGet('ChannelScan'),
		[guildId]: scanResult
	});
	return;
}

export async function createChannelHandler(
	newChannel: NonThreadGuildBasedChannel,
	parentId: string,
	parentName: string,
	guildId: string
) {
	const scanResult = myCache.myGet('ChannelScan')[guildId];

	if (parentId in scanResult) {
		scanResult[parentId].channels[newChannel.id] = {
			...defaultPartialChannelInform,
			channelName: newChannel.name
		};
	} else {
		scanResult[parentId] = {
			parentName: parentName,
			channels: {
				[newChannel.id]: {
					...defaultPartialChannelInform,
					channelName: newChannel.name
				}
			}
		};
	}
	await prisma.channelScan.update({
		where: {
			discordId: guildId
		},
		data: {
			categories: serializeChannelScan(
				{
					[guildId]: scanResult
				},
				guildId
			).categories
		}
	});
	myCache.mySet('ChannelScan', {
		...myCache.myGet('ChannelScan'),
		[guildId]: scanResult
	});
	return;
}

export async function checkStickyAndInit(
	guildChannelManager: GuildChannelManager,
	channelId: string,
	botId: string,
	type: CallType
) {
	const channel = guildChannelManager.cache.get(channelId) as TextChannel;

	if (channel && !checkIntroductionChannelPermission(channel, botId)) {
		(await channel.messages.fetch({ limit: 50 }))
			.filter((msg) => msg?.author?.bot && msg?.author?.id === botId && msg.deletable)
			.forEach((msg) => {
				msg.delete();
			});
		if (type === CallType.ONBOARDING) {
			channel.send(STICKYMSG);
		} else {
			channel.send(WOMENSTICKYMSG);
		}
	}
}
