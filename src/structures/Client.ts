import AsciiTable from 'ascii-table';
import {
	ChatInputApplicationCommandData,
	Client,
	ClientEvents,
	Collection,
	GatewayIntentBits,
	MessageApplicationCommandData,
	UserApplicationCommandData
} from 'discord.js';
import glob from 'glob';
import { promisify } from 'util';

import { prisma } from '../prisma/prisma';
import { AutoType } from '../types/Auto';
import { ButtonType } from '../types/Button';
import { StatusLockCache, VoiceContextCache } from '../types/Cache';
import { CommandType } from '../types/Command';
import { RegisterCommandsOptions } from '../types/CommandRegister';
import { ContextMenuType } from '../types/ContextMenu';
import { ModalType } from '../types/Modal';
import {
	defaultChannelScanResult,
	defaultGuildInform,
	defaultStatusLock,
	defaultVoiceContext,
	NUMBER
} from '../utils/const';
import { logger } from '../utils/logger';
import { autoArchive, checkStickyAndInit, deSerializeChannelScan } from '../utils/util';
import { myCache } from './Cache';
import { Event } from './Event';

const globPromise = promisify(glob);

export class MyClient extends Client {
	public commands: Collection<string, CommandType> = new Collection();
	public buttons: Collection<string, ButtonType> = new Collection();
	public modals: Collection<string, ModalType> = new Collection();
	public autos: Collection<string, AutoType> = new Collection();
	public menus: Collection<string, ContextMenuType> = new Collection();

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
			const menu: ContextMenuType = await this._importFiles(filePath);

			this.menus.set(menu.name, menu);
			slashCommands.push(menu);
		});

		this.once('ready', async () => {
			await this.guilds.fetch();
			await this._cacheInit();
			await this._loadSticky();
			setInterval(this._guildsAutoArchive, NUMBER.AUTO_ARCHIVE_INTERVL, this);
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
		const stautsLockCache: StatusLockCache = {};
		const voiceContextCache: VoiceContextCache = {};

		for (const guildId of this.guilds.cache.keys()) {
			stautsLockCache[guildId] = defaultStatusLock;
			voiceContextCache[guildId] = defaultVoiceContext;
		}
		myCache.mySet('StatusLock', stautsLockCache);
		myCache.mySet('VoiceContext', voiceContextCache);

		await prisma.$connect();
		logger.info('Database is connected.');
		try {
			const guildInform = await prisma.guilds.findFirst({
				cursor: {
					discordId: process.env.GUILDID
				}
			});

			this.table.addRow('Guild', '✅ Fetched and cached');

			const guildChannelScan = await prisma.channelScan.findFirst({
				cursor: {
					discordId: process.env.GUILDID
				}
			});

			this.table.addRow('ChannelScan', '✅ Fetched and cached');
			if (!guildInform) {
				await prisma.guilds.create({
					data: {
						...defaultGuildInform,
						discordId: process.env.GUILDID
					}
				});
				myCache.mySet('Guild', {
					[process.env.GUILDID]: defaultGuildInform
				});
			} else {
				delete guildInform.discordId;
				myCache.mySet('Guild', {
					[process.env.GUILDID]: guildInform
				});
			}

			if (!guildChannelScan) {
				await prisma.channelScan.create({
					data: {
						...defaultChannelScanResult,
						discordId: process.env.GUILDID
					}
				});
				myCache.mySet('ChannelScan', {
					[process.env.GUILDID]: defaultChannelScanResult
				});
			} else {
				myCache.mySet('ChannelScan', deSerializeChannelScan(guildChannelScan));
			}
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
					await checkStickyAndInit(guild.channels, introductionChannel, botId);
				}
				if (womenIntroductionChannel) {
					await checkStickyAndInit(guild.channels, womenIntroductionChannel, botId);
				}
			}
		}
	}
}
