import { Event } from '../structures/Event';
import { logger } from '../utils/logger';

export default new Event('shardError', (error: Error, shardId: number) => {
	logger.error(`Connection error occurs in shard ${shardId}. Error message: ${error.message}`);
});
