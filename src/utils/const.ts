/* eslint-disable no-unused-vars */
import { ChannelSetting, Mentorship, StickyMessageType } from '@prisma/client';
import {
	ActionRowBuilder,
	ApplicationCommandOptionChoiceData,
	ButtonBuilder,
	ButtonStyle,
	MessageReplyOptions,
	PermissionFlags
} from 'discord.js';
import list from 'timezones.json';

import { ButtonCollectorCustomId, ButtonCustomIdEnum } from '../types/Button';
import {
	CacheType,
	GuildChannelScan,
	GuildInform,
	MYNULL,
	PartialChannelInform,
	VoiceContextInform
} from '../types/Cache';
import { CommandNameEmun } from '../types/Command';

type NumericalProperty =
	| 'AWAIT_TIMEOUT'
	| 'AUTOCOMPLETE_OPTION_LENGTH'
	| 'ONBOARDING_DURATION'
	| 'EMBED_CONTENT_LIMIT'
	| 'SCAN_VIEW_DURATION'
	| 'ARCHIVE_CHANNEL_CHILD_LIMIT'
	| 'ARCHIVE_EXPIRY_TIME'
	| 'AUTO_ARCHIVE_INTERVL'
	| 'EMBED_PER_MSG'
	| 'AUTO_POST_SCAN_INTERVAL'
	| 'BIRTHDAY_SCAN_INTERVAL'
	| 'ADD_PAIR_INTERVAL';
type ErroProperty = 'COMMON' | 'GRAPHQL' | 'INTERACTION' | 'BUTTON' | 'AUTO' | 'MODAL' | 'MENU';
type CommandContentPropery =
	| 'CHANNEL_SETTING_FAIL_REPLY'
	| 'CHANNEL_SETTING_SUCCESS_REPLY'
	| 'INTRODUCTION'
	| 'WOMEN_INTRODUCTION'
	| 'ONBOARDING'
	| 'ONBOARDING_END'
	| 'WOMENVIBES'
	| 'WOMENVIBES_GOINGON'
	| 'WOMENVIBES_END'
	| 'WOMENVIBES_CALL_EVENT_NAME'
	| 'ONBOARDING_GOINGON'
	| 'THREAD_WELCOME_MSG'
	| 'WELCOME_THREAD_NAME'
	| 'ONBOARDING_CALL_EVENT_NAME'
	| 'WOMEN_THREAD_WELCOME_MSG'
	| 'CHANNEL_WITHOUT_PARENT_PARENTID'
	| 'CHANNEL_WITHOUT_PARENT_PARENTNAME'
	| 'DISCORD_MSG'
	| 'NOTIFICATION_MSG';
type LinkProperty = 'DISCORD_MSG' | 'HASHNODE_API' | 'BIRTHDAY_PIC';

type Numerical = Readonly<Record<NumericalProperty, number>>;
type InternalError = Readonly<Record<ErroProperty, string>>;
type CommandContent = Readonly<Record<CommandContentPropery, string>>;
type LINK = Readonly<Record<LinkProperty, string>>;

type ResType = {
	channel: string;
	description: string;
	link: string;
	index: string;
	meeting: string;
	meetingChannel: string;
	buttonLabel: string;
	emoji: string;
};

export const NUMBER: Numerical = {
	AWAIT_TIMEOUT: 15 * 1000,
	AUTOCOMPLETE_OPTION_LENGTH: 25,
	ONBOARDING_DURATION: 60 * 60,
	EMBED_CONTENT_LIMIT: 7,
	SCAN_VIEW_DURATION: 2 * 60 * 1000,
	ARCHIVE_CHANNEL_CHILD_LIMIT: 30,
	ARCHIVE_EXPIRY_TIME: 72 * 36000,
	AUTO_ARCHIVE_INTERVL: 120 * 60 * 1000,
	EMBED_PER_MSG: 10,
	AUTO_POST_SCAN_INTERVAL: 90 * 60 * 1000,
	BIRTHDAY_SCAN_INTERVAL: 60 * 60 * 1000,
	ADD_PAIR_INTERVAL: 4 * 60 * 1000
};

export const ERROR_REPLY: InternalError = {
	GRAPHQL: 'Error occured when running `%(action)s`: %(errorMessage)s',
	COMMON: 'Unknown Error, please report this to the admin',
	INTERACTION:
		'User: %(userName)s Guild: %(guildName)s Error: %(errorName)s occurs when executing %(commandName)s command. Msg: %(errorMsg)s Stack: %(errorStack)s.',
	BUTTON: 'User: %(userName)s Guild: %(guildName)s Error: %(errorName)s occurs when interacting %(customId)s button. Msg: %(errorMsg)s Stack: %(errorStack)s.',
	AUTO: 'User: %(userName)s Guild: %(guildName)s Error: %(errorName)s occurs when interacting %(commandName)s auto. Msg: %(errorMsg)s Stack: %(errorStack)s.',
	MODAL: 'User: %(userName)s Guild: %(guildName)s Error: %(errorName)s occurs when interacting %(customId)s modal. Msg: %(errorMsg)s Stack: %(errorStack)s.',
	MENU: 'User: %(userName)s Guild: %(guildName)s Error: %(errorName)s occurs when executing %(menuName)s menu. Msg: %(errorMsg)s Stack: %(errorStack)s.'
};

export const LINK: LINK = {
	DISCORD_MSG: 'https://discord.com/channels/%(guildId)s/%(channelId)s/%(messageId)s',
	HASHNODE_API: 'https://api.hashnode.com/',
	BIRTHDAY_PIC:
		'https://cdn.discordapp.com/attachments/1055685228443750410/1055688407411601518/birthday-cake-with-happy-birthday-banner-royalty-free-image-1656616811.png'
};

export const ButtonCollectorCustomIdRecord: Readonly<Record<ButtonCollectorCustomId, string>> = {
	first: '',
	last: '',
	previous: '',
	next: '',
	pair_confirm: ''
};

export const DefaultGuildInform: GuildInform = {
	adminCommand: [],
	adminMember: [],
	adminRole: [],
	onboardSchedule: [],
	womenVibesSchedule: [],
	channels: {
		introductionChannel: MYNULL,
		womenIntroductionChannel: MYNULL,
		notificationChannel: MYNULL,
		onboardNotificationChannel: MYNULL,
		onboardChannel: MYNULL,
		womenVibesChannel: MYNULL,
		celebrateChannel: MYNULL,
		hashNodeSubChannel: MYNULL,
		birthdayChannel: MYNULL,
		archiveCategoryChannels: []
	},
	switch: {
		autoArchiveSwitch: false
	}
};

export const DefaultPartialChannelInform: PartialChannelInform = {
	channelName: '',
	lastMsgTimestamp: '0',
	archiveTimestamp: '0',
	status: false,
	messageId: ''
};

export const DefaultVoiceContext: VoiceContextInform = {
	attendees: {},
	messageLink: null,
	hostId: null,
	channelId: null,
	duration: null,
	messageId: null
};

export const DefaultChannelScanResult: GuildChannelScan = {};

export const DefaultMentorshipConfig: Mentorship = {
	adminRole: process.env.GUILDID,
	discordId: process.env.GUILDID,
	mentorChannel: MYNULL,
	menteeChannel: MYNULL,
	playgroundChannel: MYNULL,
	playgroundChannelPinnedMsgId: MYNULL,
	tokenPerMin: 0
};

export const CACHE_KEYS: Readonly<Record<keyof CacheType, keyof CacheType>> = {
	ChannelScan: 'ChannelScan',
	Guild: 'Guild',
	VoiceContext: 'VoiceContext',
	HashNodeSub: 'HashNodeSub',
	ContactModalCache: 'ContactModalCache',
	MentorshipConfig: 'MentorshipConfig',
	CurrentEpoch: 'CurrentEpoch',
	StickyInform: 'StickyInform'
};

export enum ChannelOptionName {
	Celebration = 'celebration',
	Notification = 'notification',
	Introduction = 'introduction',
	WomenIntroduction = 'women_introduction',
	Onboarding = 'onboarding',
	WomenVibe = 'women_vibe',
	OnboardingNotification = 'onboarding_notification',
	Archive = 'archive',
	HashNodeSubscription = 'hashnode',
	Birthday = 'birthday'
}
export const channelOptionNameAndPrisamPropertyMap: Readonly<
	Record<ChannelOptionName, keyof ChannelSetting>
> = {
	celebration: 'celebrateChannel',
	notification: 'notificationChannel',
	introduction: 'introductionChannel',
	women_introduction: 'womenIntroductionChannel',
	onboarding: 'onboardChannel',
	women_vibe: 'womenVibesChannel',
	onboarding_notification: 'onboardNotificationChannel',
	archive: 'archiveCategoryChannels',
	hashnode: 'hashNodeSubChannel',
	birthday: 'birthdayChannel'
};

interface ExtendedApplicationCommandOptionChoiceData extends ApplicationCommandOptionChoiceData {
	name: CommandNameEmun;
	value: CommandNameEmun;
}

export const COMMAND_CONTENT: CommandContent = {
	ONBOARDING_CALL_EVENT_NAME: 'Group Onboarding Call',
	WOMENVIBES_CALL_EVENT_NAME: 'D_D Women Vibes',
	CHANNEL_SETTING_FAIL_REPLY:
		'Fail to set <#%(targetChannelId)s> as %(setChannelName)s channel, because of %(reason)s.',
	CHANNEL_SETTING_SUCCESS_REPLY:
		'Success to set <#%(targetChannelId)s> as %(setChannelName)s channel.',
	INTRODUCTION:
		'Hi, I am onboarding assistant 👋.... Below you can check out the schedule to attend our 🔥 group onboarding calls or introduce yourself. Feel free to send your **introduction here** first as message and click `Open an Intro Thread` button to talk with us.✨️',
	WOMEN_INTRODUCTION:
		'Hi, I am onboarding assistant 👋 Below you can check out the schedule🌈 to attend our 🔥 Women Vibes Calls✨️ or introduce yourself🌱. Feel free to send your **introduction here** first as message and click `Open an Intro Thread` button to talk with us.✨️',
	ONBOARDING:
		'%(index)d. <t:%(timestamp)s:F>(<t:%(timestamp)s:R>). RSVP [here](<%(eventLink)s>)\n\n',
	ONBOARDING_GOINGON:
		'%(index)d. Group onboarding call is currently live in %(channelInform)s 🔥🔥🔥 started (<t:%(timestamp)s:R>)\n\n',
	ONBOARDING_END:
		'Onboarding calls for this week have ended. We will update the latest ones soon.',
	WOMENVIBES:
		'%(index)d. <t:%(timestamp)s:F>(<t:%(timestamp)s:R>). RSVP [here](<%(eventLink)s>)\n\n',
	WOMENVIBES_GOINGON:
		'%(index)d. Women Vibes call is currently live in %(channelInform)s 🔥🔥🔥 started (<t:%(timestamp)s:R>)\n\n',
	WOMENVIBES_END:
		'Women Vibes calls for this week have ended. We will update the latest ones soon.',
	WELCOME_THREAD_NAME: 'Welcome %s',
	THREAD_WELCOME_MSG:
		'Glad to have you in the DAO, <@%(newComerId)s>!\nI am D_D Assistant from the community guild and onboarding team. Would you like to attend our group onboarding call to have better understanding on our DAO if it would be of value for you?\n\nYou can always walkthrough and hangout and send your questions here.\nCheck the following information to grab the latest onboarding call!\n\nBtw, if you cannot make it this week, please tell us here. I will send you schedule of the next week.\n\nYou can also use our D_D Assistant Bot to query current projects and guilds. Please click: </devdao:%(devdaoCommandId)s> and choose a query.',
	WOMEN_THREAD_WELCOME_MSG:
		"Welcome to DevDAO Women :sparkles:\n\nDevDAO women is a Social Space for Women/Nonbinary/Ally folks within Developer DAO. :seedling:\n\nFirst say say gm on :rainbow:-gm to share the blissful energy:magic_wand:\n\nDid you pick your role yet?\n\nGo to <#960706880420859904> to pick your role.\n\nIf you identify as **Women/Nonbinary** then go for :purple_heart:\nIf **you don't identify as either of them/don't want to talk about your identity** then go for :orange_heart:\n\nIf you have any ideas/topic you wanna discuss, any questions you wanna ask or just want to send some cat pictures, them <#957712595056459938> is the place for you. :wave:\n\nDon't forget to check out <#999890882251722762> if you are looking for opportunities/looking to hire someone. :rainbow:\n\nOur team call happens in Every Friday 5.00 pm UTC. :rainbow:",
	CHANNEL_WITHOUT_PARENT_PARENTID: '0',
	CHANNEL_WITHOUT_PARENT_PARENTNAME: 'No Category Name',
	DISCORD_MSG: 'https://discord.com/channels/%(guildId)s/%(channelId)s/%(messageId)s',
	NOTIFICATION_MSG:
		'Hi, D_Ds in <#%(channelId)s>\n\nAs there has been no action taken on our request to add a description to this channel, we have interpreted this as the channel is not of material importance to the server. Therefore it has been queued for archiving.\n\nChannels that do not have a description, fall out of compliance with the new standards being established by the Server Architecture Team — as it makes it difficult for Developer DAO members to be easily navigate our Discord, and find information quickly.\n\n**We are going to archive this channel <t:%(timestamp)s:R> from this notice being sent out ⚠️**\n\nIf you believe that this channel is important and should remain, please let us know in the <#993496711798456380> channel, by creating a thread using the format below:\n\n**Thread Name**: `re [insert channel name]`\n\nThanks for your cooperation! 🧰'
};

const OnboardingStickyMsg: Readonly<MessageReplyOptions> = {
	content: COMMAND_CONTENT.INTRODUCTION,
	components: [
		new ActionRowBuilder<ButtonBuilder>().addComponents([
			new ButtonBuilder()
				.setCustomId(ButtonCustomIdEnum.GetSchdule)
				.setLabel('Onboarding Call Schedule')
				.setEmoji('📆')
				.setStyle(ButtonStyle.Primary),
			new ButtonBuilder()
				.setCustomId(ButtonCustomIdEnum.CreateOnboardingThread)
				.setLabel('Open an Intro Thread')
				.setEmoji('📢')
				.setStyle(ButtonStyle.Secondary)
		])
	]
};

const WomenOnboardingStickyMsg: Readonly<MessageReplyOptions> = {
	content: COMMAND_CONTENT.WOMEN_INTRODUCTION,
	components: [
		new ActionRowBuilder<ButtonBuilder>().addComponents([
			new ButtonBuilder()
				.setCustomId(ButtonCustomIdEnum.GetSchdule)
				.setLabel('D_D Women Schedule')
				.setEmoji('📆')
				.setStyle(ButtonStyle.Primary),
			new ButtonBuilder()
				.setCustomId(ButtonCustomIdEnum.CreateOnboardingThread)
				.setLabel('Open an Intro Thread')
				.setEmoji('📢')
				.setStyle(ButtonStyle.Secondary)
		])
	]
};

const MentorshipStickyMsg: Readonly<MessageReplyOptions> = {
	content:
		'Hello, mentees and mentors. please click the button to claim or confirm your efforts!',
	components: [
		new ActionRowBuilder<ButtonBuilder>().addComponents([
			new ButtonBuilder()
				.setCustomId(ButtonCustomIdEnum.ClaimMentorEffort)
				.setLabel('Claim Teaching Period')
				.setStyle(ButtonStyle.Primary)
				.setEmoji('⏲️'),
			new ButtonBuilder()
				.setCustomId(ButtonCustomIdEnum.ConfirmMentorEffort)
				.setLabel('Confirm Mentor Efforts')
				.setStyle(ButtonStyle.Secondary)
				.setEmoji('✅')
		])
	]
};

export const StickyMsgTypeToMsg: Record<StickyMessageType, MessageReplyOptions> = {
	Mentorship: MentorshipStickyMsg,
	Onboarding: OnboardingStickyMsg,
	OnboardingWomen: WomenOnboardingStickyMsg
};

export const TIMEZONELIST: Array<string> = list.reduce((pre, cur) => {
	pre.push(...cur.utc);
	return pre;
}, []);

export const PermissionFlagBitsContent: Partial<Record<keyof PermissionFlags, string>> = {
	ViewChannel: 'Missing **VIEW CHANNEL** access.',
	SendMessages: 'Missing **SEND MESSAGES** access.',
	EmbedLinks: 'Missing **EMBED LINKS** access.',
	AttachFiles: 'Missing **ATTACH FILES** access.',
	ReadMessageHistory: 'Missing **READ MESSAGE HISTORY** access.',
	ManageChannels: 'Missing **MANAGE CHANNEL** access',
	CreatePublicThreads: 'Missing **CREATE PUBLIC THREADS** access',
	SendMessagesInThreads: 'Missing **SEND MESSAGES IN THREAD** access',
	Connect: 'Missing **CONNECT** access'
};

export const EMPTYSTRING = 'NULL';

export const MONTH_ENUM: Array<ApplicationCommandOptionChoiceData<string>> = [
	{
		name: 'January',
		value: '1'
	},
	{
		name: 'February',
		value: '2'
	},
	{
		name: 'March',
		value: '3'
	},
	{
		name: 'April',
		value: '4'
	},
	{
		name: 'May',
		value: '5'
	},
	{
		name: 'June',
		value: '6'
	},
	{
		name: 'July',
		value: '7'
	},
	{
		name: 'August',
		value: '8'
	},
	{
		name: 'September',
		value: '9'
	},
	{
		name: 'October',
		value: '10'
	},
	{
		name: 'November',
		value: '11'
	},
	{
		name: 'December',
		value: '12'
	}
];

export const COMMAND_CHOICES: Array<ExtendedApplicationCommandOptionChoiceData> = [
	{
		name: CommandNameEmun.Devdao,
		value: CommandNameEmun.Devdao
	},
	{
		name: CommandNameEmun.Guild,
		value: CommandNameEmun.Guild
	},
	{
		name: CommandNameEmun.Townhall,
		value: CommandNameEmun.Townhall
	},
	{
		name: CommandNameEmun.Mentorship,
		value: CommandNameEmun.Mentorship
	}
];

export const DOCS: Record<string, ResType> = {
	GOV: {
		channel: '908453649183813712',
		description:
			'The Governance Guild does not govern the DAO, it creates the governance mechanisms by which all DAO members govern the DAO.',
		link: 'https://developerdao.notion.site/Governance-a5c50b13aac845a081e4709565f37461',
		index: 'Guild: Governance Guild',
		meeting: 'Biweekly: Thursday 8 PM UTC',
		meetingChannel: '908724470859042856',
		buttonLabel: 'Notion Page',
		emoji: '🔗'
	},
	WRITER: {
		channel: '909616191729958982',
		description: 'Create content documenting and promoting Developer DAO activities',
		link: 'https://www.notion.so/developerdao/Writers-5d2f35a55e554410b098b903eb8f4d79',
		index: 'Guild: Writer Guild',
		meeting: 'Weekly: Tuesday 2:15 PM UTC',
		meetingChannel: '912466650069106730',
		buttonLabel: 'Notion Page',
		emoji: '🔗'
	},
	MBD: {
		channel: '908799590407471134',
		description:
			'MBD Guild looks after our Partnerships with other organisations in the web3 ecosystem. For S1, our partnerships are focused on offering Developer-Relationships-as-a-Services (DRaaS).',
		link: 'https://www.notion.so/developerdao/Marketing-Biz-Dev-967dd4faafe64f568c3e68f46a60a116',
		index: 'Guild: Marketing&Biz Dev Guild',
		meeting: 'Weekly: Friday 2 PM UTC',
		meetingChannel: '908507978402005033',
		buttonLabel: 'Notion Page',
		emoji: '🔗'
	},
	DEV: {
		channel: '913837587200872538',
		description:
			'Developement Guild is responsible for DAO-internal projects and talent coordination. Our public goods are mainly from this guild. Join in Dev Guild to start your coding journey!',
		link: 'https://www.notion.so/developerdao/Development-Guild-cb4396f623fa453981c1c4a446256250',
		index: 'Guild: Developement Guild',
		meeting: 'Weekly: Tuesday 3 PM UTC',
		meetingChannel: '908751065686634516',
		buttonLabel: 'Notion Page',
		emoji: '🔗'
	},
	DESIGN: {
		channel: '913283394543161415',
		description:
			'Branding, UX Design, Illustration, Marketing, whatever you want to do, we need you!',
		link: 'https://www.notion.so/developerdao/Design-and-Product-4fa7ec42809045fe8625fd9bcf8e0c39',
		index: 'Guild: Design&Product Guild',
		meeting: 'Biweekly: Wednesday 1 PM UTC',
		meetingChannel: '908469717503709254',
		buttonLabel: 'Notion Page',
		emoji: '🔗'
	},
	COM: {
		channel: '910203611907239946',
		description: 'Make Developer DAO welcoming and comfortable for every member!',
		link: 'https://www.notion.so/developerdao/Community-024ef6767c3e4ddbb94875bb748b1d11',
		index: 'Guild: Community Guild',
		meeting: 'Weekly: Thursday 1 PM UTC',
		meetingChannel: '908469388817088552',
		buttonLabel: 'Notion Page',
		emoji: '🔗'
	},
	SOC: {
		channel: '954866642200969286',
		description:
			'A flagship education platform, starting with lessons on smart contract development in Solidity',
		link: 'https://github.com/Developer-DAO/school-of-code',
		index: 'Education: D_D Academy',
		meeting: 'Weekly: Wednesday 6 PM UTC',
		meetingChannel: '938857901810933760',
		buttonLabel: 'Check our Repo',
		emoji: '🏫'
	},
	MS: {
		channel: '960927834728190034',
		description: 'Pairing mentors and mentees in the DAO',
		link: 'https://www.notion.so/developerdao/Mentorship-Team-80989562dcca4b568283104aab497759',
		index: 'Education: Mentorship',
		meeting: 'Weekly: Tuesday 6 PM UTC',
		meetingChannel: '995004042910642207',
		buttonLabel: 'Notion Page',
		emoji: '🎯'
	},
	DNT: {
		channel: '917515915027951646',
		description:
			'A short dive into a member\'s project: "how I built this" with 25-min presentation plus 5-min Q&A',
		link: 'https://www.notion.so/developerdao/ddcd152cd01f45d6ab003d89bb99af2d?v=2f6ab85e64724bfa99318337a8035630',
		index: 'Education: Dev-N-Tell',
		meeting: 'Weekly: Friday 3:30 PM UTC',
		meetingChannel: '883478452404092952',
		buttonLabel: 'Apply Here',
		emoji: '📽️'
	},
	WS: {
		channel: '968598797997445200',
		description: 'A longer-form, more interactive instruction on a topic',
		link: 'https://www.youtube.com/playlist?list=PLFcDwmPMBkzu5xMbFh3Vi1COI3bAoBaSI',
		index: 'Education: Workshops',
		meeting: 'Biweekly: Wednesday 4:30 PM UTC',
		meetingChannel: '883478452404092952',
		buttonLabel: 'Watch Recording',
		emoji: '📺'
	},
	WOMEN: {
		channel: '960706880420859904',
		description: 'A dedicated resources to increase inclusivity within the DAO',
		link: 'https://twitter.com/devdaowomen',
		index: 'DAO Sustainability: D_D Women',
		meeting: 'Weekly: Friday 5 PM UTC',
		meetingChannel: '957716122495504384',
		buttonLabel: 'Follow us on Twitter',
		emoji: '🚺'
	},
	GRANT: {
		channel: '950568156940869652',
		description:
			'Fundraising Operators to set up guard rails for raising funds for internal projects',
		link: 'https://discord.com/channels/883478451850473483/887319067696971826',
		index: 'DAO Sustainability: Grant Infrastructure',
		meeting: 'Weekly: Monday&Friday 1 PM UTC',
		meetingChannel: '1015259812445044796',
		buttonLabel: 'Jump to Fundraising Operators Office Hours',
		emoji: '💰'
	},
	OB: {
		channel: '907115118276542494',
		description:
			'Onboarding calls and resources help members understand what opportunities exist and how to take first steps',
		link: 'https://www.notion.so/developerdao/How-to-do-a-Group-Onboarding-Call-d64ec51fd3694f8f88e931cb1a0f6133',
		index: 'DAO Sustainability: Onboarding',
		meeting:
			'Weekly: Wednesday 1 PM UTC by <@812526237074456577>, Friday 4 PM UTC by <@906522102335668234>',
		meetingChannel: '974303396297322526',
		buttonLabel: 'How to do an Onboarding Call',
		emoji: '🤙'
	},
	EP: {
		channel: '986993222700126279',
		description:
			'A project facilitating the connection of members to projects based on skills and interests',
		link: 'https://twitter.com/edenprotocolxyz',
		index: 'DAO Sustainability: Eden Protocol',
		meeting: 'Weekly: Tuesday 4 PM UTC',
		meetingChannel: '887319067696971826',
		buttonLabel: 'Follow us on Twitter',
		emoji: '🌳'
	},
	SP: {
		channel: '939346863692320768',
		description:
			'Scribes document events, encourage accountability, and disseminate information',
		link: 'https://www.notion.so/developerdao/Scribe-s-Guide-ebb5c0ae945f4329affee0ca391e9e94',
		index: 'DAO Sustainability: Scribe Program',
		meeting: 'Weekly: Tuesday 2:15 PM UTC',
		meetingChannel: '912466650069106730',
		buttonLabel: 'How to start scribe',
		emoji: '✍️'
	},
	SAT: {
		channel: '1002959390694973524',
		description: 'A team optimizing the flow of information in our unwieldy server',
		link: 'https://github.com/Developer-DAO/Developer-DAO-Management-Bot',
		index: 'DAO Sustainability: Server Architecture Team',
		meeting: 'Weekly: Wednesday 3 PM UTC',
		meetingChannel: '887319067696971826',
		buttonLabel: 'Check our Repo',
		emoji: '🧰'
	},
	DEVREL: {
		channel: '948640569272467516',
		description:
			'Our own Developer Relationship Team, working on deliverables for our sponsors and DAO.',
		link: 'https://www.notion.so/developerdao/DevRel-ea108a8ec2a84d4e961cd72b7ba4c226',
		index: 'DAO Sustainability: Devrel Team ',
		meeting: 'Weekly: Wednesday 7 PM UTC',
		meetingChannel: '908507978402005033',
		buttonLabel: 'Notion Page',
		emoji: '🔗'
	},
	AXIS: {
		channel: '934118513843511326',
		description: 'Inclusive pathways into the DAO',
		link: 'https://discord.com/channels/883478451850473483/934118513843511326',
		index: 'DAO Sustainability: AxisOne Program',
		meeting: 'Weekly: Friday 3 PM UTC',
		meetingChannel: '908469388817088552',
		buttonLabel: 'Jump into the channel',
		emoji: '🔗'
	},
	OKR: {
		channel: '979764277592342618',
		description:
			'A team ensuring that initiatives have realistic goals that align with the DAO mission',
		link: 'https://discord.com/channels/883478451850473483/979764277592342618',
		index: 'DAO Sustainability: OKRs',
		meeting: 'Biweekly: Monday 1 PM UTC',
		meetingChannel: '887319067696971826',
		buttonLabel: 'Jump into the channel',
		emoji: '🎁'
	},
	AGENCY: {
		channel: '973582245296214066',
		description: 'An exploration into specialized teams for hire',
		link: 'https://github.com/Developer-DAO/d_d-agency-landing',
		index: 'DAO Sustainability: D_D Agency',
		meeting: 'Weekly: Wednesday 3 PM UTC',
		meetingChannel: '887319067696971826',
		buttonLabel: 'Check our Repo',
		emoji: '🚪'
	},
	VIBES: {
		channel: '979900319985172570',
		description: 'In-person social gatherings',
		link: 'https://discord.com/channels/883478451850473483/979900319985172570',
		index: 'DAO Sustainability: Vibes IRL',
		meeting: 'Weekly: CN Friday 1 PM UTC, ESP Friday',
		meetingChannel: '979900319985172570',
		buttonLabel: 'Jump into our Party!',
		emoji: '🥳'
	},
	WEB: {
		channel: '884852584941232169',
		description: 'A group of contributors working on D_D Website',
		link: 'https://github.com/Developer-DAO/developer-dao-dot-com',
		index: 'DAO Sustainability: Developer DAO Website Team',
		meeting: 'Weekly: Wednesday 4 PM UTC',
		meetingChannel: '887319375034585098',
		buttonLabel: 'Check our Repo',
		emoji: '💻'
	},
	UI: {
		channel: '913935677404631110',
		description:
			'One of the most famous projects in Developer DAO, helping with your web3 frontend journey.',
		link: 'https://github.com/Developer-DAO/web3-ui',
		index: 'DAO Sustainability: Web3 UI',
		meeting: 'Weekly: Saturday 3 PM UTC',
		meetingChannel: '887319375034585098',
		buttonLabel: 'Check our Repo',
		emoji: '🖥️'
	},
	TH: {
		channel: '992102856557609073',
		description:
			'Monthly DAO-wide, interactive Q&A session - followed by a Quiz 🏆 and a Raffle 🎟',
		link: 'https://discord.com/channels/883478451850473483/1010155397937627247',
		index: 'DAO Sustainability: Town Hall',
		meeting: 'Monthly: The last Friday of each month',
		meetingChannel: '1010155397937627247',
		buttonLabel: 'Jump into the Party',
		emoji: '🎉'
	}
};

export enum WEEK {
	Sunday,
	Monday,
	Tuesday,
	Wednesday,
	Thursday,
	Friday,
	Saturday
}

export enum MONTH {
	January,
	February,
	March,
	April,
	May,
	June,
	July,
	August,
	September,
	October,
	November,
	December
}

export enum MentorshipChannelOptionName {
	Playground = 'playground',
	Mentor = 'mentor',
	Mentee = 'mentee'
}
