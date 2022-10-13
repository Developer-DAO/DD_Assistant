import { sprintf } from 'sprintf-js';
import { Auto } from '../structures/AutoComplete';
import { myCache } from '../structures/Cache';
import { COMMAND_CONTENT, NUMBER } from '../utils/const';
import { convertTimeStamp } from '../utils/util';

export default new Auto({
	correspondingCommandName: 'onboard',
	execute: ({ interaction }) => {
		const guildId = interaction.guild.id;
        // todo no need to give response when input comes
		const guildInformCache = myCache.myGet('Guild')[guildId];
		if (!guildInformCache) return interaction.respond([]);

		const choices = guildInformCache.onboardSchedule
			.map((value, index) =>
				sprintf(COMMAND_CONTENT.ONBOARDING_OPTION, {
					index: index + 1,
					timestamp: convertTimeStamp(value.timestamp)
				})
			)
			.slice(0, NUMBER.AUTOCOMPLETE_OPTION_LENGTH);

		if (choices.length ===0)
			return interaction.respond([{ name: 'No onboarding call schedule', value: '-1' }]);

		return interaction.respond(
			choices.map((value, index) => ({
				name: value,
				value: (index + 1).toString()
			}))
		);
	}
});
