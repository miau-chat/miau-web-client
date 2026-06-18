// taken from the Meown project
type StringSchema = {
	type: "string";
	default?: string;
	transform?: (value: string) => string;
	includes?: string[];
	minLength?: number;
	maxLength?: number;
};

type NumberSchema = {
	type: "number";
	default?: number;
	round?: number;
	includes?: number[];
	min?: number;
	max?: number;
};

type BooleanSchema = {
	type: "boolean";
	default?: boolean;
};

type ArraySchema = {
	type: "array";
	items: JSONSchema;
};

type TupleSchema = {
	type: "tuple";
	items: readonly JSONSchema[];
};

type ObjectSchema = {
	type: "object";
	default?: any;
	properties: Record<string, JSONSchema>;
	required?: readonly string[];
	additionalProperties?: boolean;
};

type JSONSchema =
	| StringSchema
	| NumberSchema
	| BooleanSchema
	| ArraySchema
	| TupleSchema
	| ObjectSchema;

// limit inference to 9 levels
type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

type Infer<T, D extends number = 5> = [D] extends [never]
	? never
	: T extends StringSchema
	? string
	: T extends NumberSchema
	? number
	: T extends BooleanSchema
	? boolean
	: T extends ArraySchema
	? Infer<T["items"], Prev[D]>[]
	: T extends TupleSchema
	? T["items"] extends readonly [...infer Items]
		? { [K in keyof Items]: Infer<Items[K], Prev[D]> }
		: never
	: T extends ObjectSchema
	? InferObject<T["properties"], T["required"], Prev[D]>
	: never;
type RequiredKeys<R> = R extends readonly (infer U)[] ? U & string : never;

type InferObject<
	P extends Record<string, JSONSchema>,
	R extends readonly string[] | undefined,
	D extends number
> = {
	[K in keyof P as K extends RequiredKeys<R> ? K : never]-?: Infer<P[K], D>;
} & {
	[K in keyof P as K extends RequiredKeys<R> ? never : K]?: Infer<P[K], D>;
};

class SchemaUtil {
	public static createError(path: string[], message: string): never {
		throw {
			path,
			message,
		};
	}

	public static validate(
		schema: JSONSchema,
		value: any,
		path: string[] = []
	): any {
		switch (schema.type) {
			case "string": {
				if (typeof value !== "string") {
					SchemaUtil.createError(path, "Expected string");
				}

				if (schema.transform != undefined) {
					value = schema.transform(value);
				}

				if (schema.minLength != undefined && schema.minLength > value.length) {
					SchemaUtil.createError(path, "String length too short");
				}

				if (schema.maxLength != undefined && schema.maxLength < value.length) {
					SchemaUtil.createError(path, "String length too long");
				}

				if (
					schema.includes != undefined &&
					schema.includes.includes(value) != true
				) {
					SchemaUtil.createError(
						path,
						"String does not contain expected value"
					);
				}

				return value;
			}
			case "number": {
				if (typeof value !== "number") {
					SchemaUtil.createError(path, "Expected number");
				}

				if (schema.min != undefined && schema.min > value) {
					SchemaUtil.createError(path, "Number is too small");
				}

				if (schema.max != undefined && schema.max < value) {
					SchemaUtil.createError(path, "Number is too big");
				}

				if (schema.round != undefined) {
					value = Math.ceil(value / schema.round) * schema.round;
				}

				if (
					schema.includes != undefined &&
					schema.includes.includes(value) != true
				) {
					SchemaUtil.createError(
						path,
						"Number does not contain expected value"
					);
				}
				return value;
			}

			case "boolean": {
				if (typeof value != "boolean") {
					SchemaUtil.createError(path, "Expected boolean");
				}
				return value;
			}
			case "array": {
				if (!Array.isArray(value)) {
					SchemaUtil.createError(path, "Expected array");
				}
				return value.map((v, i) =>
					SchemaUtil.validate(schema.items, v, [...path, String(i)])
				);
			}
			case "tuple": {
				if (!Array.isArray(value)) {
					SchemaUtil.createError(path, "Expected tuple");
				}

				return schema.items.map((s, i) =>
					SchemaUtil.validate(s, value[i], [...path, String(i)])
				);
			}
			case "object": {
				if (typeof value !== "object" || value === null) {
					SchemaUtil.createError(path, "Expected object");
				}

				const result: any = {};
				const required = schema.required ?? [];

				for (const key of required) {
					if (!(key in value)) {
						SchemaUtil.createError([...path, key], "Missing required field");
					}
				}

				for (const key in schema.properties) {
					if (required.includes(key)) {
						result[key] = SchemaUtil.validate(
							schema.properties[key],
							(value as any)[key],
							[...path, key]
						);
					} else {
						try {
							result[key] = SchemaUtil.validate(
								schema.properties[key],
								(value as any)[key],
								[...path, key]
							);
						} catch (e) {}
					}
				}

				return result;
			}
		}
	}
}

class SanitySchemaMini {
	static string(
		options?: Omit<Extract<JSONSchema, { type: "string" }>, "type">
	): Extract<JSONSchema, { type: "string" }> {
		return { type: "string", ...options };
	}

	static number(
		options?: Omit<Extract<JSONSchema, { type: "number" }>, "type">
	): Extract<JSONSchema, { type: "number" }> {
		return { type: "number", ...options };
	}

	static tuple(
		items: ((s: typeof SanitySchemaMini) => JSONSchema[]) | JSONSchema[],
		options?: Omit<Extract<JSONSchema, { type: "tuple" }>, "type" | "items">
	): Extract<JSONSchema, { type: "tuple" }> {
		const _items = typeof items == "function" ? items(SanitySchemaMini) : items;
		return { type: "tuple", items: _items, ...options };
	}

	static array(
		items: ((s: typeof SanitySchemaMini) => JSONSchema) | JSONSchema,
		options?: Omit<Extract<JSONSchema, { type: "array" }>, "type" | "items">
	): Extract<JSONSchema, { type: "array" }> {
		const _items = typeof items == "function" ? items(SanitySchemaMini) : items;
		return { type: "array", items: _items, ...options };
	}

	static object(
		props:
			| ((s: typeof SanitySchemaMini) => Record<string, JSONSchema>)
			| Record<string, JSONSchema>,
		options?: Omit<
			Extract<JSONSchema, { type: "object" }>,
			"type" | "properties"
		>
	): Extract<JSONSchema, { type: "object" }> {
		const properties =
			typeof props == "function" ? props(SanitySchemaMini) : props;

		return { type: "object", properties, ...options };
	}
}

class SanitySchema {
	static readonly s = SanitySchemaMini;
	static readonly validate = SchemaUtil.validate;

	static parse<T extends JSONSchema, D extends unknown>(
		schema: T,
		data: D
	): Infer<T> {
		return SchemaUtil.validate(schema, data);
	}

	static safeParse<T extends JSONSchema, const D extends unknown>(
		schema: T,
		data: D
	): { success: true; data: Infer<T> } | { success: false; error: any } {
		try {
			let g = data as any;
			return { success: true, data: this.parse(schema, g) };
		} catch (e) {
			return { success: false, error: e };
		}
	}

	// strict
	static parseStrict<T extends JSONSchema, D extends Infer<T>>(
		schema: T,
		data: D
	): Infer<T> {
		let g = data as any;
		return SchemaUtil.validate(schema, g);
	}

	static safeParseStrict<T extends JSONSchema, const D extends Infer<T>>(
		schema: T,
		data: D
	): { success: true; data: Infer<T> } | { success: false; error: any } {
		try {
			let g = data as any;
			return { success: true, data: this.parse(schema, g) };
		} catch (e) {
			return { success: false, error: e };
		}
	}
}

export {
	type JSONSchema,
	SanitySchema,
	SanitySchemaMini,
	SanitySchemaMini as s,
};
