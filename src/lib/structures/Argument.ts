import { AutocompleteContext } from './contexts/AutocompleteContext';
import Logger from 'js-logger';
import { z } from 'zod';

export enum ArgumentType {
	'SUB_COMMAND' = 1,
	'SUB_COMMAND_GROUP' = 2,
	'STRING' = 3,
	'INTEGER' = 4,
	'BOOLEAN' = 5,
	'USER' = 6,
	'CHANNEL' = 7,
	'ROLE' = 8,
	'MENTIONABLE' = 9,
	'NUMBER' = 10,
}

export enum ChannelType {
	'GUILD_TEXT' = 0,
	'GUILD_VOICE' = 2,
	'GUILD_CATEGORY' = 4,
	'GUILD_STORE' = 6,
	'GUILD_NEWS_THREAD' = 10,
	'GUILD_PUBLIC_THREAD' = 11,
	'GUILD_PRIVATE_THREAD' = 12,
	'GUILD_STAGE_VOICE' = 13,
}

export interface ArgumentChoice {
	name: string;
	value: string;
}

export interface ArgumentOptions {
	name: string;
	description: string;
	type: ArgumentType | keyof typeof ArgumentType;
	required?: boolean;
	choices?: Array<ArgumentChoice>;
	arguments?: Array<Argument | ArgumentOptions>;
	channelTypes?: Array<ChannelType | keyof typeof ChannelType>;
	run?: (ctx: AutocompleteContext) => any;
}

const validationSchema = z
	.object({
		name: z
			.string()
			.max(32)
			.regex(/^[a-zA-Z1-9]/),
		description: z.string().max(100),
		type: z
			.union([z.string(), z.nativeEnum(ArgumentType)])
			.transform((arg) => (Object.keys(ArgumentType).includes(String(arg)) ? ArgumentType[arg] : arg)),
		required: z.boolean().optional(),
		choices: z
			.object({
				name: z.string(),
				value: z.string(),
			})
			.array()
			.optional(),
		arguments: z.any(),
		channelTypes: z
			.union([z.string(), z.nativeEnum(ChannelType)])
			.transform((arg) => (Object.keys(ChannelType).includes(String(arg)) ? ChannelType[arg] : arg))
			.array()
			.optional(),
		run: z.function().optional(),
	})
	.passthrough();

export class Argument {
	public name: string;
	public description: string;
	public type: ArgumentType | keyof typeof ArgumentType;
	public required = false;
	public choices?: Array<ArgumentChoice>;
	public arguments?: Array<Argument>;
	public channelTypes?: Array<ChannelType | keyof typeof ChannelType>;
	public run?: (ctx: AutocompleteContext) => any;

	constructor(options: ArgumentOptions) {
		validationSchema
			.parseAsync(options)
			.then((options) => {
				this.name = options.name;
				this.description = options.description;
				this.type = options.type;
				this.required = options.required;
				// @ts-expect-error This is really weird lol
				this.choices = options.choices;
				this.arguments = Array.isArray(options.arguments)
					? options.arguments.map((argument) => {
							if (argument instanceof Argument) return argument;
							else return new Argument(argument);
					  })
					: undefined;
				this.channelTypes = options.channelTypes;
				this.run = options.run;
			})
			.catch((error) => {
				Logger.warn(typeof error.code !== 'undefined' ? error.code : '', error.message);
				if (error.stack) Logger.trace(error.stack);
			});
	}

	public toJSON(): Record<string, any> {
		if (this.type === ArgumentType.SUB_COMMAND || this.type === ArgumentType.SUB_COMMAND_GROUP) {
			return {
				name: this.name,
				description: this.description,
				type: this.type,
				options: this.arguments?.map((argument) => argument.toJSON()),
			};
		}

		return {
			name: this.name,
			description: this.description,
			type: this.type,
			required: this.required,
			choices: this.choices,
			channel_types: this.channelTypes,
			autocomplete: typeof this.run === 'function',
		};
	}
}
