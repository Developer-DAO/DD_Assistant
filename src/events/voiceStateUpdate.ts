import { VoiceState } from 'discord.js';

import { myCache } from '../structures/Cache';
import { Event } from '../structures/Event';
import { getCurrentTimeMin } from '../utils/util';

export default new Event('voiceStateUpdate', (oldState: VoiceState, newState: VoiceState) => {
	if (newState.member.user.bot) return;
	if (!myCache.myHas('VoiceContext') || !myCache.myGet('VoiceContext').channelId) return;
	const guildId = oldState.guild.id;
	const guildVoiceContext = myCache.myGet('VoiceContext')[guildId];
	const current = getCurrentTimeMin();

	// Join this event
	if (
		oldState?.channel?.id !== guildVoiceContext.channelId &&
		newState?.channel?.id === guildVoiceContext.channelId
	) {
		guildVoiceContext.attendees[newState.member.id] = {
			timestamp: current,
			name: newState.member.displayName
		};
		// Jump out from this event
	} else return;
	myCache.mySet('VoiceContext', {
		...myCache.myGet('VoiceContext'),
		[guildId]: guildVoiceContext
	});
});
