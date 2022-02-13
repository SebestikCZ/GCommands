import { Collection, CommandInteractionOptionResolver, Message } from 'discord.js';
import type { GClient } from '../lib/GClient';
import { CommandContext } from '../lib/structures/contexts/CommandContext';
import { CommandType } from '../lib/structures/Command';
import { ArgumentType } from '../lib/structures/Argument';
import { Commands } from '../lib/managers/CommandManager';
import { Handlers } from '../lib/managers/HandlerManager';
import { Logger, Events } from '../lib/util/logger/Logger';
import { Util } from '../lib/util/Util';

const cooldowns = new Collection<string, Collection<string, number>>();

export async function MessageCommandHandler(
	message: Message,
	commandName: string,
	args: Array<string> | Array<object>,
) {
	const client = message.client as GClient;

	const command = Commands.get(commandName);
	if (!command && client.options?.unknownCommandMessage)
		return message.reply({
			content: (await Util.getResponse('NOT_FOUND', { client })),
		});

	if (!command.type.includes(CommandType.MESSAGE)) return;

	if (command.cooldown) {
		const cooldown = Handlers.cooldownHandler(message.author.id, command, cooldowns);
		if (cooldown)
			return message.reply({
				content: (await Util.getResponse('COOLDOWN', { client })).replace('{time}', String(cooldown)).replace(
					'{name}',
					command.name + ' command',
				),
			});
	}

	args = args.map(
		(arg, i) =>
			new Object({
				name: command.arguments[i].name,
				type: command.arguments[i].type,
				choices: command.arguments[i].choices,
				options: [],
				value: arg,
			}),
	);

	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	if (args[0]?.type === (ArgumentType.SUB_COMMAND_GROUP || ArgumentType.SUB_COMMAND)) args[0].options = args.splice(1);
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	if (args[0]?.type === ArgumentType.SUB_COMMAND_GROUP && args[0]?.options[0]?.type === ArgumentType.SUB_COMMAND)
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		args[0].options[0].options = args[0].options.splice(1);

	let replied: Message;
	const ctx = new CommandContext(client, {
		message: message,
		channel: message.channel,
		createdAt: message.createdAt,
		createdTimestamp: message.createdTimestamp,
		guild: message.guild,
		guildId: message.guildId,
		user: message.author,
		member: message.member,
		memberPermissions: message.member.permissions,
		command: command,
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-expect-error
		arguments: new CommandInteractionOptionResolver(client, args, {}),
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-expect-error This will not be fixed (typings for interaction are more important)
		deferReply: () => {
			return;
		},
		deleteReply: async () => {
			await replied.delete();
		},
		editReply: async (opt) => {
			return await replied.edit(opt);
		},
		fetchReply: async () => {
			return replied;
		},
		followUp: message.reply.bind(message),
		reply: message.reply.bind(message),
	});

	if (!(await command.inhibit(ctx))) return;
	await Promise.resolve(command.run(ctx))
		.catch(async (error) => {
			Logger.emit(Events.HANDLER_ERROR, ctx, error);
			Logger.emit(Events.COMMAND_HANDLER_ERROR, ctx, error);
			Logger.error(typeof error.code !== 'undefined' ? error.code : '', error.message);
			if (error.stack) Logger.trace(error.stack);

			const errorReply = async() =>
				ctx.safeReply({
					content: (await Util.getResponse('ERROR', { client })),
					components: [],
				});
			
			if (typeof command.onError === 'function')
				await Promise.resolve(command.onError(ctx, error)).catch(async () => await errorReply());
			else await errorReply();
		})
		.then(() => {
			Logger.emit(Events.HANDLER_RUN, ctx);
			Logger.emit(Events.COMMAND_HANDLER_RUN, ctx);
			Logger.debug(`Successfully ran command (${command.name}) for ${message.author.username}`);
		});
}
