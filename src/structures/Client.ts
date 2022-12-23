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
import { promisify } from 'util';

import { getPosts } from '../graph/GetUser.query';
import { prisma } from '../prisma/prisma';
import { AutoType } from '../types/Auto';
import { ButtonType } from '../types/Button';
import { HashNodeSubCache, VoiceContextCache } from '../types/Cache';
import { CommandType } from '../types/Command';
import { RegisterCommandsOptions } from '../types/CommandRegister';
import { MessageContextMenuType, UserContextMenuType } from '../types/ContextMenu';
import { ModalType } from '../types/Modal';
import { CallType } from '../types/Util';
import {
	defaultChannelScanResult,
	defaultGuildInform,
	defaultVoiceContext,
	LINK,
	NUMBER
} from '../utils/const';
import { logger } from '../utils/logger';
import {
	autoArchive,
	checkChannelPermission,
	checkStickyAndInit,
	deSerializeChannelScan,
	getNextBirthday
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
			await this._cacheInit();
			await this._loadSticky();
			setInterval(async () => {
				try {
					await prisma.$connect()
				} catch (error) {
					console.log(error);
				}
			}, 60 * 1000);
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
		const guildId = process.env.GUILDID;

		for (const guildId of this.guilds.cache.keys()) {
			voiceContextCache[guildId] = defaultVoiceContext;
		}
		myCache.mySet('VoiceContext', voiceContextCache);

		await prisma.$connect();
		logger.info('Database is connected.');
		try {
			const guildInform = await prisma.guilds.findFirst({
				cursor: {
					discordId: guildId
				}
			});

			this.table.addRow('Guild', '✅ Fetched and cached');

			const guildChannelScan = await prisma.channelScan.findFirst({
				cursor: {
					discordId: guildId
				}
			});

			this.table.addRow('ChannelScan', '✅ Fetched and cached');
			if (!guildInform) {
				await prisma.guilds.create({
					data: {
						...defaultGuildInform,
						discordId: guildId
					}
				});
				myCache.mySet('Guild', {
					[guildId]: defaultGuildInform
				});
			} else {
				delete guildInform.discordId;
				myCache.mySet('Guild', {
					[guildId]: guildInform
				});
			}

			if (!guildChannelScan) {
				await prisma.channelScan.create({
					data: {
						...defaultChannelScanResult,
						discordId: guildId
					}
				});
				myCache.mySet('ChannelScan', {
					[guildId]: defaultChannelScanResult
				});
			} else {
				myCache.mySet('ChannelScan', deSerializeChannelScan(guildChannelScan));
			}

			const hashNodeData = await prisma.hashNodeSub.findMany({
				where: {
					discordId: guildId
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
		const guildsCache = myCache.myGet('Guild');

		for (const [guildId, guild] of this.guilds.cache) {
			if (guild.available) {
				const { introductionChannel, womenIntroductionChannel } =
					guildsCache[guildId].channels;
				const botId = guild.members.me.id;

				if (introductionChannel) {
					await checkStickyAndInit(
						guild.channels,
						introductionChannel,
						botId,
						CallType.ONBOARDING
					);
				}
				if (womenIntroductionChannel) {
					await checkStickyAndInit(
						guild.channels,
						womenIntroductionChannel,
						botId,
						CallType.WOMENVIBES
					);
				}
			}
		}
	}

	private async _fetchHashNodePost(client: MyClient) {
		console.log(1)
		if (!myCache.myHas('HashNodeSub')) return;
		const cache = myCache.myGet('HashNodeSub');

		const guildId = process.env.GUILDID;
		const hashNodeSubChannelId = myCache.myGet('Guild')[guildId].channels.hashNodeSubChannel;

		if (!hashNodeSubChannelId) return;
		const guild = client.guilds.cache.get(guildId);

		if (!guild) return;
		const hashNodeSubChannel = guild.channels.cache.get(hashNodeSubChannelId) as TextChannel;

		if (!hashNodeSubChannel) return;
		const permissionChecking = checkChannelPermission(hashNodeSubChannel, guild.members.me.id);

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
