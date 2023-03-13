import {
	ActionRowBuilder,
	MessageReplyOptions,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle
} from 'discord.js';

import { prisma } from '../prisma/prisma';
import { Button } from '../structures/Button';
import { ButtonCustomIdEnum } from '../types/Button';
import { ModalCustomIdEnum } from '../types/Modal';
import { Result } from '../types/Result';

export default new Button({
	customIds: [ButtonCustomIdEnum.ClaimMentorEffort, ButtonCustomIdEnum.ConfirmMentorEffort],
	execute: async ({ interaction }) => {
		const { member, customId } = interaction;
		const { id: memberId } = member;

		await interaction.deferReply({ ephemeral: true });

		if (customId === ButtonCustomIdEnum.ClaimMentorEffort) {
			const result = await claimEffort(memberId);

			if (result.is_err) {
				return interaction.followUp({
					content: result.error.message
				});
			}

            return interaction.showModal(result.unwrap())
		} else {
			await confirmEffort(memberId);
		}
	}
});

// For Mentor
async function claimEffort(memberId: string): Promise<Result<ModalBuilder, Error>> {
	try {
		const mentor = await prisma.mentor.findFirst({
			cursor: {
				id: memberId
			}
		});

		if (!mentor) {
			return Result.Err(new Error('Sorry, you are not registered in the database.'));
		}

		const mentorModel = new ModalBuilder()
			.setTitle('Confirm your Efforts')
			.setCustomId(ModalCustomIdEnum.ClaimMentorEffort);

		mentorModel.addComponents(
			new ActionRowBuilder<TextInputBuilder>().addComponents([
				new TextInputBuilder()
					.setCustomId('claim_hrs')
					.setLabel('Input your working hours')
					.setPlaceholder('Integer Only')
					.setStyle(TextInputStyle.Short)
			])
		);
		return Result.Ok(mentorModel);
	} catch (e: unknown) {
		return Result.Err(new Error('Error occurs when quering data. Please try again'));
	}
}

// For Mentee
async function confirmEffort(memberId: string) {
	try {
	} catch (e: unknown) {}
}
