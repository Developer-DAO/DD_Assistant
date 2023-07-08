import { TextChannel } from 'discord.js';

import { prisma } from '../prisma/prisma';
import { Button } from '../structures/Button';
import { myCache } from '../structures/Cache';
import { ButtonCustomIdEnum } from '../types/Button';
import { NUMBER } from '../utils/const';
import { getNotificationMsg, getParentInform, serializeChannelScan } from '../utils/util';

export default new Button({
	customIds: [ButtonCustomIdEnum.SendNotificationToChannel, ButtonCustomIdEnum.DeleteChannelFromScanResult],
	execute: async ({ interaction }) => {
		const guildId = interaction.guild.id;
		const scanResult = myCache.myGet('ChannelScan')[guildId];
		const [embed] = interaction.message.embeds;
		const [field] = embed.fields.filter((value) => value.name === 'Channel');
		const channelId = field.value.slice(2, -1);
		const channel = interaction.guild.channels.cache.get(channelId) as TextChannel;

		if (!channel) {
			return interaction.reply({
				content: 'Sorry, this channel is unfetchable.',
				ephemeral: true
			});
		}
		const { parentId } = getParentInform(channel.parentId, channel.parent);
		const component = interaction.message.components[0].toJSON();

		component.components[0].disabled = true;
		component.components[1].disabled = true;

		let replyMsg: string;

		switch (interaction.customId) {
			case 'send': {
				const archiveTimestamp =
					Math.floor(new Date().getTime() / 1000) + NUMBER.ARCHIVE_EXPIRY_TIME;
				const notificationMsg = await channel.send(
					getNotificationMsg(channel.id, archiveTimestamp)
				);

				scanResult[parentId].channels[channelId] = {
					channelName: channel.name,
					archiveTimestamp: archiveTimestamp.toString(),
					lastMsgTimestamp: Math.floor(
						notificationMsg.createdTimestamp / 1000
					).toString(),
					messageId: notificationMsg.id,
					status: true
				};

				replyMsg = 'Message was sent.';
				break;
			}
			case 'delete': {
				delete scanResult[parentId].channels[channel.id];
				replyMsg = 'Channel was deleted.';
				break;
			}
		}

		await interaction.deferReply({ ephemeral: true });
		await prisma.channelScan.update({
			where: {
				discordId: guildId
			},
			data: {
				categories: serializeChannelScan(
					{
						[guildId]: scanResult
					},
					guildId
				).categories
			}
		});

		await interaction.message.edit({
			embeds: [embed],
			components: [component]
		});

		myCache.mySet('ChannelScan', {
			[guildId]: scanResult
		});

		return interaction.followUp({
			content: replyMsg
		});
	}
});
