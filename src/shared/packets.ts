export enum ErrorCodes {
	ServerError = 0,
	BadReqest = 1,
	Forbidden = 2,
	NotFound = 3,
	NotAuthenticated = 4,
}

export type TUserStatus = "offline" | "online" | "away" | "social";
export type TChannelUpdate = {
	name?: string;
	topic?: string;
	private?: true;
};

export type InboundPacket =
	| ["ping"]
	| ["ready"]
	| ["user", user_id: string, password: string]
	| ["message", target: string, content: string]
	| ["channels_get"]
	| ["channel_join", channel: string]
	| ["channel_leave", channel: string]
	| ["channel_users", channel: string]
	| ["command", name: string, args: string[]];

export type OutboundPacket =
	| ["pong"]
	| ["error", ErrorCodes]
	| ["registered"]
	| [
			"message",
			channel: string,
			content: string,
			options: {
				user_id?: string;
				timestamp: number;
			}
	  ]
	| [
			"user_message",
			user_id: string,
			channel: string,
			content: string,
			options: {
				timestamp: number;
			}
	  ]
	| ["user_status", user_id: string, status: TUserStatus]
	| ["channels_list", string[]]
	| ["channels_mine", string[]]
	| ["channel_join", channel: string, user_id: string]
	| ["channel_leave", channel: string, user_id: string]
	| ["channel_users", channel: string, users: string[]]
	| ["channel_info", channel: string, info: TChannelUpdate];

export type PacketOf<T extends InboundPacket | OutboundPacket> = Extract<
	T,
	[T[0], ...any]
>;

export type PacketFrom<
	T extends InboundPacket | OutboundPacket,
	K extends T[0]
> = Extract<T, [K, ...any]>;
