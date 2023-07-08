import { MyCronJob } from '../types/Cron';
import {
	keepPrismaConnectionAlive,
	mentorshipEpochUpdate,
	updateMentorshipPlayground
} from './cronjobs';

export const epochUpdate = new MyCronJob(
	'Mentorship Epoch',
	// Update every Monday at 00:00:00 UTC
	'0 0 * * 1',
	mentorshipEpochUpdate,
	undefined,
	true,
	undefined,
	undefined,
	undefined,
	// UTC Offset
	0
);

export const keepPrismaConnectionAliveJob = new MyCronJob(
	'Keep Prisma Connection Alive',
	'0 * * * * *',
	keepPrismaConnectionAlive,
	undefined,
	true,
	undefined,
	undefined,
	undefined,
	0
);

export const updateMentorshipPlaygroundJob = new MyCronJob(
	'Periodically update mentorship playground Message',
	// Update every 30 minutes
	'*/30 * * * *',
	updateMentorshipPlayground,
	undefined,
	true,
	undefined,
	undefined,
	undefined,
	0
);
