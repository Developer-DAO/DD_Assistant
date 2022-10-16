/* eslint-disable no-unused-vars */

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
