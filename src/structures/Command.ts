import { CommandType } from '../types/Command';

export class Command {
	public constructor(public commandOptions: CommandType) {
        Object.assign(this, commandOptions)
    }
}
