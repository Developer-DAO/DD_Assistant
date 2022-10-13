import {
	ActionRowBuilder,
	ApplicationCommandOptionChoiceData,
	ButtonBuilder,
	ButtonStyle,
	MessageReplyOptions
} from 'discord.js';
import { GuildChannelScan, GuildInform, MYNULL, VoiceContextCache } from '../types/Cache';
import { CommandNameEmun } from '../types/Command';

type NumericalProperty =
	| 'AWAIT_TIMEOUT'
	| 'AUTOCOMPLETE_OPTION_LENGTH'
	| 'ONBOARDING_DURATION'
	| 'CHANNEL_CHECK_BUTTON_COLLECTOR_INTERNAL';
type ErroProperty = 'COMMON' | 'GRAPHQL' | 'INTERACTION' | 'BUTTON' | 'AUTO' | 'MODAL' | 'MENU';
type CommandContentPropery =
	| 'CHANNEL_SETTING_FAIL_REPLY'
	| 'CHANNEL_SETTING_SUCCESS_REPLY'
	| 'INTRODUCTION'
	| 'ONBOARDING'
	| 'ONBOARDING_END'
	| 'ONBOARDING_OPTION'
	| 'ONBOARDING_GOINGON'
	| 'THREAD_WELCOME_MSG'
	| 'WELCOME_THREAD_NAME'
	| 'ONBOARDING_CALL_EVENT_NAME';

type Numerical = Readonly<Record<NumericalProperty, number>>;
type InternalError = Readonly<Record<ErroProperty, string>>;
type CommandContent = Readonly<Record<CommandContentPropery, string>>;

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
	ONBOARDING_DURATION: 60,
	CHANNEL_CHECK_BUTTON_COLLECTOR_INTERNAL: 2 * 60 * 1000
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

export const LINK = {
	DISCORD_MSG: 'https://discord.com/channels/%(guildId)s/%(channelId)s/%(messageId)s'
};

export const defaultGuildInform: GuildInform = {
	adminCommand: [],
	adminMember: [],
	adminRole: [],
	archiveCategoryChannels: [],
	archiveChannels: [],
	onboardSchedule: [],
	channels: {
		introductionChannel: MYNULL,
		notificationChannel: MYNULL,
		onboardChannel: MYNULL,
		celebrateChannel: MYNULL
	}
};

export const defaultVoiceContextCache: VoiceContextCache = {
	attendees: {},
	messageLink: null,
	hostId: null,
	channelId: null,
	duration: null
};

export const defaultChannelScanResult: GuildChannelScan = {
	categories: []
};

interface ExtendedApplicationCommandOptionChoiceData extends ApplicationCommandOptionChoiceData {
	name: CommandNameEmun;
	value: CommandNameEmun;
}

export const COMMAND_CONTENT: CommandContent = {
	ONBOARDING_CALL_EVENT_NAME: 'Group Onboarding Call',
	CHANNEL_SETTING_FAIL_REPLY:
		'Fail to set <#%(targetChannelId)s> as %(setChannelName)s channel, because of `%(reason)s`.',
	CHANNEL_SETTING_SUCCESS_REPLY:
		'Success to set <#%(targetChannelId)s> as %(setChannelName)s channel.',
	INTRODUCTION:
		'Hi, I am onboarding assistant 👋.... Below you can check out the schedule to attend our 🔥 group onboarding calls or chat with a D_D community manager 🤝',
	ONBOARDING:
		'%(index)d. <t:%(timestamp)s:F>(<t:%(timestamp)s:R>). RSVP [here](<%(eventLink)s>)\n',
	ONBOARDING_GOINGON:
		'%(index)d. Group onboarding Call is currently live in %(channelInform)s 🔥🔥🔥 Started (<t:%(timestamp)s:R>)\n',
	ONBOARDING_END:
		'Onboarding calls for this week have ended. We will update the latest ones this Sunday or next Monday.',
	ONBOARDING_OPTION: '%(index)d. %(timestamp)s.',
	WELCOME_THREAD_NAME: 'Welcome <@%s>',
	THREAD_WELCOME_MSG:
		'Glad to have you in the DAO, <@%(newComerId)s>!\nI am D_D Assistant from the community guild and onboarding team. Would you like to attend our group onboarding call to have better understanding on our DAO if it would be of value for you?\n\nBtw, you can always walkthrough and hangout and send your questions here.\nClick the following button to grab the latest onboarding call!\n\nbtw, if you cannot make it this week, please click the notify button. I will send you schedule of the next week.\n\nYou can also use our D_D Assistant Bot to query current projects and guilds. Please click: </devdao:1016532004185063464> and choose a query.'
};

export const STICKYMSG: Readonly<MessageReplyOptions> = {
	content:
		'Click the button to check your transaction status. Transaction results from the bot are only VIEWABLE by you (and no one else).',
	components: [
		new ActionRowBuilder<ButtonBuilder>().addComponents([
			new ButtonBuilder()
				.setCustomId('schedule')
				.setLabel('Onboarding Call Schedule')
				.setEmoji('📆')
				.setStyle(ButtonStyle.Primary),
			new ButtonBuilder()
				.setCustomId('talk')
				.setLabel('Talk with us')
				.setEmoji('📢')
				.setStyle(ButtonStyle.Secondary)
			// new ButtonBuilder()
			// 	.setCustomId('instruction')
			// 	.setLabel('DAO Instruction')
			// 	.setEmoji('📚')
			// 	.setStyle(ButtonStyle.Success)
		])
	]
};

export const EMOJI = {
	// ✅
	CHECK_MARK: '1029777569303765044',
	// ❌
	WRONG: '1029777597707603988'
};

export const COMMAND_CHOICES: Array<ExtendedApplicationCommandOptionChoiceData> = [
	{
		name: 'devdao',
		value: 'devdao'
	},
	{
		name: 'birthday',
		value: 'birthday'
	},
	{
		name: 'guild',
		value: 'guild'
	},
	{
		name: 'onboard',
		value: 'onboard'
	},
	{
		name: 'townhall',
		value: 'townhall'
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
	Sunday = "Sunday",
	Monday = 'Monday',
	Tuesday = 'Tuesday',
	Wednesday = 'Wednesday',
	Thursday = 'Thursday',
	Friday = 'Friday',
	Saturday = 'Saturday'
}

export enum MONTH{
	January = 'January',
	February = 'February',
	March = 'March',
	April = 'April',
	May = 'May',
	June = 'June',
	July = 'July',
	August = 'August',
	September = 'September',
	October = 'October',
	November = 'November',
	December = 'December'
}
