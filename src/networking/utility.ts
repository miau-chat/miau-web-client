import { ChannelList } from "../components.js";
import { channel_list, message_list, user_list } from "../global_elements.js";
import { PacketFormatter } from "../shared/format.js";
import { InboundPacket, OutboundPacket } from "../shared/packets.js";
import { main_data } from "./main.js";
import { socket } from "./websocket-client.js";

export class ClientUtility {
	static handlePacket(packet_in: OutboundPacket) {
		const packet = PacketFormatter.validateOutbound(packet_in);
		if (packet == undefined) {
			return;
		}

		switch (packet[0]) {
			case "channels_list": {
				main_data.channels.clear();

				for (const channel of packet[1]) {
					main_data.channels_available.add(channel);
				}
				channel_list.update();
				break;
			}
			case "channel_users": {
				const [_, channel_name, users] = packet;
				const channel = main_data.findOrCreateChannel(channel_name);
				channel.users = users;
				user_list.update();
				break;
			}
			case "channel_join": {
				main_data.current_channel = packet[1];
				channel_list.update();
				break;
			}

			case "message": {
				const channel_name = packet[1];
				const channel = main_data.channels.get(channel_name);

				if (channel == undefined) return;

				channel.messages.push(packet);
				if (channel_name == main_data.current_channel) {
					message_list.add(packet);
				}

				break;
			}
		}
	}

	static send(socket: WebSocket, packet: InboundPacket) {
		socket.send(JSON.stringify(packet));
	}
}
