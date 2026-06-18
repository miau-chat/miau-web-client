import { ErrorCodes, InboundPacket, OutboundPacket } from "./packets.js";
import { JSONSchema, SanitySchema } from "./util/schema.js";

const type: JSONSchema = { type: "string" };
const s = SanitySchema.s;

export const inbound_schemas = {
	ping: s.tuple([type]),
	ready: s.tuple([type]),
	user: s.tuple((t) => [type, t.string(), t.string()]),
	message: s.tuple((t) => [type, t.string(), t.string()]),
	channels_get: s.tuple([type]),
	channel_join: s.tuple((t) => [type, t.string()]),
	channel_leave: s.tuple((t) => [type, t.string()]),
	channel_users: s.tuple((t) => [type, t.string()]),
	command: s.tuple((t) => [type, t.string(), t.array((a) => a.string())]),
} satisfies Record<InboundPacket[0], JSONSchema>;

export const outbound_schemas = {
	pong: s.tuple([type]),
	error: s.tuple((t) => [
		t.number({
			includes: Object.entries(ErrorCodes).filter((n) => typeof n == "number"),
		}),
	]),
	registered: s.tuple([type]),
	message: s.tuple((t) => [
		type,
		t.string(),
		t.string(),
		t.object((o) => ({
			timestamp: o.number(),
			user_id: o.string(),
		})),
	]),
	user_message: s.tuple((t) => [
		type,
		t.string(),
		t.string(),
		t.string(),
		t.object((o) => ({
			timestamp: o.number(),
			user_id: o.string(),
		})),
	]),
	user_status: s.tuple((t) => [
		type,
		t.string(),
		t.string({ includes: ["offline", "online", "away", "social"] }),
	]),
	channels_list: s.tuple((t) => [type, t.array((a) => a.string())]),
	channels_mine: s.tuple((t) => [type, t.array((a) => a.string())]),
	channel_join: s.tuple((t) => [type, t.string(), t.string()]),
	channel_leave: s.tuple((t) => [type, t.string(), t.string()]),
	channel_users: s.tuple((t) => [type, t.string(), t.array((a) => a.string())]),
	channel_info: s.tuple((t) => [
		type,
		t.string(),
		t.object((o) => ({
			name: o.string(),
			topic: o.string(),
			private: o.string(),
		})),
	]),
} satisfies Record<OutboundPacket[0], JSONSchema>;
