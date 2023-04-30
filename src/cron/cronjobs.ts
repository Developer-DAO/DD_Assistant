import { ResultAsync } from 'neverthrow';

import { client } from '..';
import { getPlaygroundChannel } from '../commands/mentorship';
import { prisma } from '../prisma/prisma';
import { myCache } from '../structures/Cache';
import { startOfIsoWeekUnix } from '../utils/util';
import { epochUpdate, keepPrismaConnectionAliveJob, updateMentorshipPlaygroundJob } from './cron';

export async function mentorshipEpochUpdate() {
	try {
		const discordId = process.env.GUILDID;
		const mentorshipConfig = await prisma.mentorship.findFirst({
			cursor: {
				discordId
			}
		});

		if (!mentorshipConfig) {
			return epochUpdate.logStatus('Inform', 'Mentorship config not found');
		}

		if (!mentorshipConfig.isEpochStarted) {
			return epochUpdate.logStatus('Inform', 'Mentorship epoch is not started yet');
		}

		const startTimestamp = startOfIsoWeekUnix().toString();
		const endTimestamp = epochUpdate.getNextEpochEndUnixTime().toString();

		const result = await prisma.epoch.create({
			data: {
				discordId,
				startTimestamp,
				endTimestamp
			}
		});

		myCache.mySet('CurrentEpoch', {
			[discordId]: result
		});
	} catch (error) {
		return epochUpdate.logStatus('Error', undefined, error);
	}
}

export const keepPrismaConnectionAlive = () =>
	ResultAsync.fromPromise(prisma.$connect(), (err: Error) =>
		keepPrismaConnectionAliveJob.logStatus('Error', undefined, err)
	);

export const updateMentorshipPlayground = async () => {
	const guild = client.guilds.cache.get(process.env.GUILDID);

	if (!guild) {
		return updateMentorshipPlaygroundJob.logStatus(
			'Error',
			undefined,
			'Cannot fetch guild object from client.'
		);
	}
	const channelResult = getPlaygroundChannel(guild);

	if (channelResult.isErr()) {
		return updateMentorshipPlaygroundJob.logStatus(
			'Error',
			undefined,
			'Cannot fetch playground channel.'
		);
	}
};
