import { CronJob } from 'cron';
import dayjs from 'dayjs';

import { logger } from '../utils/logger';

export class MyCronJob extends CronJob {
	public name: string;
	public latestError: {
		message: string;
		unixTimestamp: number;
	};
	public constructor(
		name: string,
		cronTime: string | Date,
		onTick: () => void,
		onComplete?: () => void,
		start?: boolean,
		timeZone?: string,
		context?: any,
		runOnInit?: boolean,
		utcOffset?: number,
		unrefTimeout?: boolean
	) {
		super(
			cronTime,
			onTick,
			onComplete,
			start,
			timeZone,
			context,
			runOnInit,
			utcOffset,
			unrefTimeout
		);
		this.name = name;
	}

	public logStatus(type: 'Inform' | 'Error', inform: string | undefined, error?: any) {
		if (type === 'Error') {
			this._recordError(error.message, dayjs().unix());
			return logger.info(`CronJob ${this.name} error occurred: ${error}}`);
		}
		logger.info(`CronJob ${this.name}: ${inform}}`);
	}

	public getNextUnixTime() {
		return this.nextDates().toSeconds();
	}

	public getNextEpochEndUnixTime() {
		return this.nextDates().toSeconds() - 1;
	}

	public report() {
		return {
			name: this.name,
			nextRunUnix: this.nextDates().toSeconds(),
			lastRunUnix: this.lastDate() ? dayjs(this.lastDate()).unix() : undefined,
			running: this.running,
			isError: this.latestError ? true : false,
			latestError: this.latestError
		};
	}

	private _recordError(message: string, unixTimestamp: number) {
		this.latestError = {
			message,
			unixTimestamp
		};
	}
}
