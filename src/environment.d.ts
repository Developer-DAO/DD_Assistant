import { CommandNameEmun } from './types/Command';

declare global {
	namespace NodeJS {
		interface ProcessEnv {
			TOKEN: string;
			GUILDID: string;
			PROJECTID: string;
			MODE: 'dev' | 'prod';
		}
	}
}

export {};
