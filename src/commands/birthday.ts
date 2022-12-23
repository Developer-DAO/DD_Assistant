import { ApplicationCommandOptionType, ApplicationCommandType } from 'discord.js';

import { prisma } from '../prisma/prisma';
import { myCache } from '../structures/Cache';
import { Command } from '../structures/Command';
import { CommandNameEmun } from '../types/Command';
import { EMPTYSTRING, MONTH_ENUM } from '../utils/const';
import { awaitWrap, dateIsValid, fetchCommandId, getNextBirthday } from '../utils/util';

export default new Command({
	name: CommandNameEmun.Birthday,
	type: ApplicationCommandType.ChatInput,
	description: 'Tell me your birthday and we celebrate togather!',
	options: [
		{
			name: 'month',
			description: 'Your birthday month',
			type: ApplicationCommandOptionType.String,
			required: true,
			choices: MONTH_ENUM
		},
		{
			name: 'day',
			description: 'Your birthday day',
			type: ApplicationCommandOptionType.Integer,
			required: true
		},
		{
			name: 'timezone',
			description: 'Search and choose your city',
			type: ApplicationCommandOptionType.String,
			required: true,
			autocomplete: true
		}
	],
	execute: async ({ interaction, args }) => {
		if (!myCache.myGet('Guild')?.[interaction.guild.id]?.channels?.birthdayChannel) {
			const guildCommandId = fetchCommandId(CommandNameEmun.Guild, interaction.guild);

			return interaction.reply({
				content: `Please use </guild set channel:${guildCommandId}> to set a Birthday Celebrate Channel first.`,
				ephemeral: true
			});
		}

		const [month, day, offset] = [
			args.getString('month'),
			args.getInteger('day').toString(),
			args.getString('timezone')
		];

		const userId = interaction.user.id;

		if (!dateIsValid(month, day))
			return interaction.reply({
				content: `Your input date is invalid.`,
				ephemeral: true
			});

		if (offset === EMPTYSTRING) {
			return interaction.reply({
				content: `Your input timezone is invalid.`,
				ephemeral: true
			});
		}

		const result = getNextBirthday(month, day, offset);

		if (result.errorFlag) {
			return interaction.reply({
				content: `We cannot find \`${offset}\`, because ${result.errorMsg}.`,
				ephemeral: true
			});
		}

		await interaction.deferReply({ ephemeral: true });
		const { error } = await awaitWrap(
			prisma.birthday.upsert({
				where: {
					userId
				},
				update: {
					date: result.birthday.toString(),
					month,
					day,
					timezone: offset
				},
				create: {
					userId,
					date: result.birthday.toString(),
					month,
					day,
					timezone: offset
				}
			})
		);

		if (error) {
			return interaction.followUp({
				content: 'Sorry, cannot connect with Database, please try again later.'
			});
		}

		return interaction.followUp({
			content: `Your birthday date has been updated. Next birthday is <t:${result.birthday}:D>(<t:${result.birthday}:R>)`
		});
	}
});
