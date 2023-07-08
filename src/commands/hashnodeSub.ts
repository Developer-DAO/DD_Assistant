import { ApplicationCommandOptionType, ApplicationCommandType, TextChannel } from 'discord.js';

import { getPosts } from '../graph/GetUser.query';
import { prisma } from '../prisma/prisma';
import { myCache } from '../structures/Cache';
import { Command } from '../structures/Command';
import { CommandNameEmun } from '../types/Command';
import { checkTextChannelPermission, fetchCommandId } from '../utils/util';

export default new Command({
	name: CommandNameEmun.Hashnode_sub,
	description: 'Subscribe a user in the hashnode and get notification in subscribe channel.',
	type: ApplicationCommandType.ChatInput,
	options: [
		{
			name: 'username',
			description: "The username of the hashnode you'd like to subscribe",
			type: ApplicationCommandOptionType.String,
			required: true
		}
	],
	execute: async ({ interaction, args }) => {
		const hashNodeUserName = args.getString('username');
		const { guildId, guild } = interaction;
		const hashNodeSubChannelId = myCache.myGet('Guild')[guildId]?.channels?.hashNodeSubChannel;

		if (!hashNodeSubChannelId) {
			const guildCommandId = fetchCommandId(CommandNameEmun.Guild, guild);

			return interaction.reply({
				content: `Please use </guild set channel:${guildCommandId}> to set up a subscribe channel.`,
				ephemeral: true
			});
		}
		const hashNodeSubChannel = guild.channels.cache.get(hashNodeSubChannelId) as TextChannel;

		if (!hashNodeSubChannel) {
			return interaction.reply({
				content: `Sorry, <#${hashNodeSubChannelId}> is unfetchable.`,
				ephemeral: true
			});
		}
		const permissionChecking = checkTextChannelPermission(
			hashNodeSubChannel,
			guild.members.me.id
		);

		if (permissionChecking) {
			return interaction.reply({
				content: `Sorry, I cannot send messages to <#${hashNodeSubChannelId}>, because ${permissionChecking}`,
				ephemeral: true
			});
		}
		await interaction.deferReply({ ephemeral: true });

		if (myCache.myGet('HashNodeSub')[hashNodeUserName]) {
			return interaction.followUp({
				content: `Sorry, ${hashNodeUserName} has been added to the subcription list.`
			});
		}

		const { result, error } = await getPosts({
			username: hashNodeUserName
		});

		if (error) {
			return interaction.followUp({
				content: `GraphQL error: \`${error}\``
			});
		}
		const pubDomain = result.user.publicationDomain;
		const blogHandle = result.user.blogHandle;

		if (!pubDomain && !blogHandle) {
			return interaction.followUp({
				content:
					"Please check your input, I cannot find this user in the HashNode. A valid user name is the words after '@', like: `https://hashnode.com/@Alex1237`."
			});
		}

		const createResult = await prisma.hashNodeSub.create({
			data: {
				discordId: guildId,
				hashNodeUserName
			},
			select: {
				id: true
			}
		});

		myCache.mySet('HashNodeSub', {
			...myCache.myGet('HashNodeSub'),
			[hashNodeUserName]: {
				latestCuid: '',
				id: createResult.id,
				hashNodeUserName
			}
		});

		return interaction.followUp({
			content: `You have successfully subscribed \`${hashNodeUserName}\` HashNode.`
		});
		/*
            I don't know the username, because hashnode always shows me the custom domain,
            61ca14525fc5da1847327f6b
            does this ID make sense?
            it's the ID that shows up in the URL when I navigate the admin panel
            https://hashnode.com/61ca14525fc5da1847327f6b/dashboard
        */
	}
});
