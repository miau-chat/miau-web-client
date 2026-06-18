import { OutboundPacket, PacketFrom } from "../shared/packets.js";

interface ChannelData {
	users: string[];
	messages: PacketFrom<OutboundPacket, "message">[];
	name?: string;
	topic?: string;
	private?: true;
}

export class MiauChatData {
	channels: Map<string, ChannelData> = new Map();
	channels_available: Set<string> = new Set();
	channels_mine: Set<string> = new Set();
	current_channel?: string;

	findOrCreateChannel(name: string): ChannelData {
		if (this.channels.has(name) != true) {
			this.channels.set(name, { users: [], messages: [] });
		}
		return this.channels.get(name)!;
	}
}
