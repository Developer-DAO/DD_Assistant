import { Birthday } from '@prisma/client';
import AsciiTable from 'ascii-table';
import {
	ChatInputApplicationCommandData,
	Client,
	ClientEvents,
	Collection,
	EmbedBuilder,
	GatewayIntentBits,
	MessageApplicationCommandData,
	TextChannel,
	UserApplicationCommandData
} from 'discord.js';
import glob from 'glob';
import { ResultAsync } from 'neverthrow';
import { promisify } from 'util';

import { getPlaygroundChannel, initPlaygroundChannel } from '../commands/mentorship';
import { epochUpdate } from '../cron/cron';
import { getPosts } from '../graph/GetUser.query';
import { prisma } from '../prisma/prisma';
import { AutoType } from '../types/Auto';
import { ButtonType } from '../types/Button';
import { HashNodeSubCache, VoiceContextCache } from '../types/Cache';
import { CommandType } from '../types/Command';
import { RegisterCommandsOptions } from '../types/CommandRegister';
import { MessageContextMenuType, UserContextMenuType } from '../types/ContextMenu';
import { ModalType } from '../types/Modal';
import {
	DefaultChannelScanResult,
	DefaultGuildInform,
	DefaultMentorshipConfig,
	DefaultVoiceContext,
	LINK,
	NUMBER,
	StickyMsgTypeToMsg
} from '../utils/const';
import dayjs from '../utils/dayjs';
import { logger } from '../utils/logger';
import {
	autoArchive,
	awaitWrap,
	checkTextChannelPermission,
	checkTextChannelPermissionForStickyMsg,
	deSerializeChannelScan,
	getNextBirthday,
	startOfIsoWeekUnix
} from '../utils/util';
import { myCache } from './Cache';
import { Event } from './Event';

const globPromise = promisify(glob);

export class MyClient extends Client {
	public commands: Collection<
		string,
		CommandType | MessageContextMenuType | UserContextMenuType
	> = new Collection();
	public buttons: Collection<string, ButtonType> = new Collection();
	public modals: Collection<string, ModalType> = new Collection();
	public autos: Collection<string, AutoType> = new Collection();

	private table: any;

	public constructor() {
		super({
			intents: [
				GatewayIntentBits.Guilds,
				GatewayIntentBits.GuildMessages,
				GatewayIntentBits.MessageContent,
				GatewayIntentBits.GuildMembers,
				GatewayIntentBits.GuildPresences,
				GatewayIntentBits.DirectMessageReactions,
				GatewayIntentBits.GuildVoiceStates
			]
		});

		this.table = new AsciiTable('Cache Loading ...');
		this.table.setHeading('Data', 'Status');
	}

	public start() {
		try {
			this._loadFiles();
			this.login(process.env.TOKEN);
		} catch (error) {
			logger.error(error?.message);
		}
	}

	private async _registerCommands({ guildId, commands }: RegisterCommandsOptions) {
		if (guildId) {
			// Register the commands in this guild
			this.guilds.cache.get(guildId)?.commands.set(commands);
			logger.info('Commands are set locally.');
		} else {
			// Register the commands in this application, covering all guilds
			// this.application.commands?.set([]);
			this.application.commands?.set(commands);
			logger.info('Commands are set globally.');
		}
	}

	private async _importFiles(filePath: string) {
		return (await import(filePath))?.default;
	}

	private async _loadFiles() {
		// Load Commands
		const slashCommands: Array<
			| ChatInputApplicationCommandData
			| MessageApplicationCommandData
			| UserApplicationCommandData
		> = [];
		const commandFiles = await globPromise(`${__dirname}/../commands/*{.ts,.js}`);

		commandFiles.forEach(async (filePath) => {
			const command: CommandType = await this._importFiles(filePath);

			if (!command.name) return;
			this.commands.set(command.name, command);
			slashCommands.push(command);
		});

		const buttonFiles = await globPromise(`${__dirname}/../buttons/*{.ts,.js}`);

		buttonFiles.forEach(async (filePath) => {
			const button: ButtonType = await this._importFiles(filePath);

			button.customIds.forEach((customId) => {
				this.buttons.set(customId, button);
			});
		});

		const modalFiles = await globPromise(`${__dirname}/../modals/*{.ts,.js}`);

		modalFiles.forEach(async (filePath) => {
			const modal: ModalType = await this._importFiles(filePath);

			this.modals.set(modal.customId, modal);
		});

		const autoFiles = await globPromise(`${__dirname}/../autocompletes/*{.ts,.js}`);

		autoFiles.forEach(async (filePath) => {
			const auto: AutoType = await this._importFiles(filePath);

			this.autos.set(auto.correspondingCommandName, auto);
		});

		const menuFiles = await globPromise(`${__dirname}/../contextmenus/*{.ts,.js}`);

		menuFiles.forEach(async (filePath) => {
			const menu: MessageContextMenuType | UserContextMenuType = await this._importFiles(
				filePath
			);

			this.commands.set(menu.name, menu);
			slashCommands.push(menu);
		});

		this.once('ready', async () => {
			await this.guilds.fetch();
			await this.guilds.cache.get(process.env.GUILDID)?.commands.fetch();
			await this._cacheInit();
			await this._loadSticky();
			await this._loadMentorshiconfig();
			setInterval(this._guildsAutoArchive, NUMBER.AUTO_ARCHIVE_INTERVL, this);
			setInterval(this._fetchHashNodePost, NUMBER.AUTO_POST_SCAN_INTERVAL, this);
			setInterval(this._birthdayScan, NUMBER.BIRTHDAY_SCAN_INTERVAL, this);
			if (process.env.MODE === 'dev') {
				await this._registerCommands({
					guildId: process.env.GUILDID,
					commands: slashCommands
				});
			} else {
				this._registerCommands({
					commands: slashCommands
				});
			}
		});

		// Load Events
		const eventFiles = await globPromise(`${__dirname}/../events/*{.ts,.js}`);

		eventFiles.forEach(async (filePath) => {
			const event: Event<keyof ClientEvents> = await this._importFiles(filePath);

			this.on(event.eventName, event.run);
		});
	}

	private async _cacheInit() {
		const voiceContextCache: VoiceContextCache = {};
		const discordId = process.env.GUILDID;

		for (const guildId of this.guilds.cache.keys()) {
			voiceContextCache[guildId] = DefaultVoiceContext;
		}
		myCache.mySet('VoiceContext', voiceContextCache);

		await prisma.$connect();
		logger.info('Database is connected...');
		try {
			const guildInform = await prisma.guilds.findFirst({
				cursor: {
					discordId
				}
			});

			this.table.addRow('Guild', '✅ Fetched and cached');

			const guildChannelScan = await prisma.channelScan.findFirst({
				cursor: {
					discordId
				}
			});

			this.table.addRow('ChannelScan', '✅ Fetched and cached');
			if (!guildInform) {
				await prisma.guilds.create({
					data: {
						...DefaultGuildInform,
						discordId
					}
				});
				myCache.mySet('Guild', {
					[discordId]: DefaultGuildInform
				});
			} else {
				delete guildInform.discordId;
				myCache.mySet('Guild', {
					[discordId]: guildInform
				});
			}

			if (!guildChannelScan) {
				await prisma.channelScan.create({
					data: {
						...DefaultChannelScanResult,
						discordId
					}
				});
				myCache.mySet('ChannelScan', {
					[discordId]: DefaultChannelScanResult
				});
			} else {
				myCache.mySet('ChannelScan', deSerializeChannelScan(guildChannelScan));
			}

			const mentorshipConfig = await prisma.mentorship.findFirst({
				cursor: {
					discordId
				}
			});

			if (!mentorshipConfig) {
				await prisma.mentorship.create({
					data: DefaultMentorshipConfig
				});
				myCache.mySet('MentorshipConfig', {
					[discordId]: DefaultMentorshipConfig
				});
			} else {
				myCache.mySet('MentorshipConfig', {
					[discordId]: mentorshipConfig
				});
			}
			this.table.addRow('MentorshipConfig', '✅ Fetched and cached');

			const { isEpochStarted } = myCache.myGet('MentorshipConfig')[discordId];

			if (isEpochStarted) {
				let currentEpoch = await prisma.epoch.findFirst({
					orderBy: {
						startTimestamp: 'desc'
					},
					where: {
						discordId
					}
				});
				const now = dayjs.utc().unix();

				if (Number(currentEpoch.endTimestamp) < now) {
					currentEpoch = await prisma.epoch.create({
						data: {
							discordId,
							startTimestamp: startOfIsoWeekUnix().toString(),
							endTimestamp: epochUpdate.getNextEpochEndUnixTime().toString()
						}
					});
				}

				myCache.mySet('CurrentEpoch', {
					[discordId]: currentEpoch
				});
			} else {
				myCache.mySet('CurrentEpoch', {});
			}
			this.table.addRow('Epoch', '✅ Fetched and cached');

			const stickRecords = await prisma.stickyInform.findFirst({
				where: {
					discordId
				},
				include: {
					stickRecords: {
						where: {
							stickyInformDiscordId: discordId
						}
					}
				}
			});

			if (stickRecords) {
				myCache.mySet(
					'StickyInform',
					stickRecords.stickRecords.reduce((pre, cur) => {
						pre[cur.channelId] = cur;
						return pre;
					}, {})
				);
			} else {
				await prisma.stickyInform.create({
					data: {
						discordId,
						stickRecords: {
							create: []
						}
					}
				});
				myCache.mySet('StickyInform', {});
			}
			this.table.addRow('Sticky Records', '✅ Fetched and cached');

			const hashNodeData = await prisma.hashNodeSub.findMany({
				where: {
					discordId: discordId
				}
			});
			const hashNodeCache: HashNodeSubCache = hashNodeData.reduce((pre, cur) => {
				pre[cur.hashNodeUserName] = {
					latestCuid: cur.latestCuid,
					id: cur.id,
					hashNodeUserName: cur.hashNodeUserName
				};
				return pre;
			}, {});

			myCache.mySet('HashNodeSub', hashNodeCache);
			this.table.addRow('HashNodeSub', '✅ Fetched and cached');

			myCache.mySet('ContactModalCache', {});
			this.table.addRow('Contact', '✅ Fetched and cached');
			logger.info(`\n${this.table.toString()}`);
		} catch (error) {
			// todo handle errors correctly
			logger.error(error);
			process.exit(0);
		}
	}

	private async _guildsAutoArchive(client: MyClient) {
		const guildsInform = myCache.myGet('Guild');

		for (const [guildId, guild] of client.guilds.cache) {
			const { autoArchiveSwitch } = guildsInform[guildId].switch;

			if (autoArchiveSwitch) {
				await autoArchive(guild.channels, guildId, guild.members.me.id);
			}
		}
	}

	private async _loadSticky() {
		const guild = this.guilds.cache.get(process.env.GUILDID);
		const stickyRecords = myCache.myGet('StickyInform');

		if (!guild || Object.keys(stickyRecords).length === 0) return;
		const botId = guild.members.me.id;

		for (const { channelId, messageId, messageType } of Object.values(stickyRecords)) {
			const channel = guild.channels.cache.get(channelId) as TextChannel;

			if (checkTextChannelPermissionForStickyMsg(channel, botId)) continue;
			if (!channel) continue;
			const { result: message } = await awaitWrap(channel.messages.fetch(messageId));

			if (message) {
				await message.delete();
			}
			stickyRecords[channelId].messageId = (
				await channel.send(StickyMsgTypeToMsg[messageType])
			).id;
		}
		await Promise.all(
			Object.values(stickyRecords).map((value) =>
				prisma.stickyRecord.update({
					where: {
						channelId: value.channelId
					},
					data: {
						messageId: value.messageId
					}
				})
			)
		);
		myCache.mySet('StickyInform', stickyRecords);
	}

	private async _loadMentorshiconfig() {
		// Load Mentorship Playground
		const guild = this.guilds.cache.get(process.env.GUILDID);
		const playgroundChannelResult = getPlaygroundChannel(guild);
		const pgChannelMessageId =
			myCache.myGet('MentorshipConfig')[guild.id].playgroundChannelMsgId;

		if (playgroundChannelResult.isErr()) return;
		// Not care about the return type
		return ResultAsync.fromPromise(
			playgroundChannelResult.value.messages.fetch(pgChannelMessageId),
			() => new Error('Cannot fetch playground channel message')
		).orElse(() => initPlaygroundChannel(playgroundChannelResult.value) as any);
	}

	private async _fetchHashNodePost(client: MyClient) {
		if (!myCache.myHas('HashNodeSub')) return;
		const cache = myCache.myGet('HashNodeSub');

		const guildId = process.env.GUILDID;
		const hashNodeSubChannelId = myCache.myGet('Guild')[guildId].channels.hashNodeSubChannel;

		if (!hashNodeSubChannelId) return;
		const guild = client.guilds.cache.get(guildId);

		if (!guild) return;
		const hashNodeSubChannel = guild.channels.cache.get(hashNodeSubChannelId) as TextChannel;

		if (!hashNodeSubChannel) return;
		const permissionChecking = checkTextChannelPermission(
			hashNodeSubChannel,
			guild.members.me.id
		);

		if (permissionChecking) return;
		const embeds: Array<EmbedBuilder> = [];

		for (const { hashNodeUserName, latestCuid, id } of Object.values(cache)) {
			const { result, error } = await getPosts({
				username: hashNodeUserName
			});

			if (error) continue;
			if (result.user.publication.posts.length === 0) return;
			const dateDescPosts = result.user.publication.posts.sort(
				(a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
			);
			const [latestPost] = dateDescPosts;

			if (latestPost.cuid !== latestCuid) {
				let prefix = `${result.user.blogHandle}.hashnode.dev`;

				if (result.user.publicationDomain) {
					prefix = result.user.publicationDomain;
				}
				const embed = new EmbedBuilder()
					.setTitle(latestPost.title)
					.setAuthor({ name: hashNodeUserName, iconURL: result.user.photo })
					.setDescription(latestPost.brief)
					.setColor('#3366FF')
					.setURL(`https://${prefix}/${latestPost.slug}-${latestPost.cuid}`)
					.setFooter({
						text: `${hashNodeUserName} on Hashnode`
					});

				if (latestPost.coverImage) {
					embed.setImage(latestPost.coverImage);
				}
				embeds.push(embed);

				await prisma.hashNodeSub.update({
					where: {
						id
					},
					data: {
						latestCuid: latestPost.cuid
					}
				});
				cache[hashNodeUserName].latestCuid = latestPost.cuid;
			}
		}
		if (embeds.length === 0) return;
		myCache.mySet('HashNodeSub', cache);
		let counter = 0;

		while (true) {
			await hashNodeSubChannel.send({
				embeds: embeds.slice(counter, counter + NUMBER.EMBED_PER_MSG)
			});
			if (counter + NUMBER.EMBED_PER_MSG >= embeds.length) break;
			counter += NUMBER.EMBED_PER_MSG;
		}
		return;
	}

	private async _birthdayScan(client: MyClient) {
		if (!myCache.myHas('Guild')) return;
		const guildId = process.env.GUILDID;
		const guild = client.guilds.cache.get(guildId);

		if (!guild) return;
		const birthdayChannelId = myCache.myGet('Guild')[guildId]?.channels?.birthdayChannel;

		if (!birthdayChannelId) return;
		const birthdayChannel = guild.channels.cache.get(birthdayChannelId) as TextChannel;

		if (!birthdayChannel) return;

		const birthdays = await prisma.birthday.findMany();
		const current = Math.floor(new Date().getTime() / 1000);
		const nonBirthdayArray: Array<string> = [];
		const toBeUpdatedBirthdayInform: Array<Pick<Birthday, 'date' | 'userId'>> = [];

		const todaysBirthday: Array<Birthday> = birthdays
			.sort((a, b) => Number(a.date) - Number(b.date))
			.reduce((pre, cur) => {
				const { month, timezone, day, userId } = cur;
				const date = Number(cur.date);

				if (current > date) {
					pre.push(cur);
					const result = getNextBirthday(month, day, timezone);

					toBeUpdatedBirthdayInform.push({
						date: result.birthday.toString(),
						userId
					});
				} else {
					nonBirthdayArray.push(userId);
				}
				return pre;
			}, []);

		if (todaysBirthday.length === 0) return;

		let birthdayContent = todaysBirthday.reduce((pre, cur) => {
			const tmp = pre + `<@${cur.userId}>`;

			return tmp;
		}, '');

		birthdayContent += ', today is your birthday! Enjoy your day!';

		const embed = new EmbedBuilder().setTitle('Happy Birthday!🥳').setImage(LINK.BIRTHDAY_PIC);

		if (nonBirthdayArray.length !== 0) {
			embed.setDescription(`Next superstar is <@${nonBirthdayArray[0]}>!`);
		} else {
			embed.setDescription(`Next superstar is <@${todaysBirthday[0].userId}>!`);
		}

		for (const { userId, date } of toBeUpdatedBirthdayInform) {
			await prisma.birthday.update({
				where: {
					userId
				},
				data: {
					date
				}
			});
		}

		await birthdayChannel.send({
			content: birthdayContent,
			embeds: [embed]
		});
	}
}
