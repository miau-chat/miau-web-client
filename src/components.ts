import { OraCss, VNode } from "@orago/dom";
import { ClientUtility } from "./networking/utility.js";
import { socket } from "./networking/websocket-client.js";
import { main_data } from "./networking/main.js";
import { random } from "@orago/lib/math";
import { OutboundPacket, PacketFrom } from "./shared/packets.js";

const styles = new OraCss()
	.styles((s) => {
		s.add(".user-list", {});
	})
	.build()
	.attach();

export class ChannelList extends VNode {
	static createItem(name: string) {
		return new VNode("li")
			.class("channel-item")
			.value(name)
			.style({
				color: `rgb(${random(50, 200)}, ${random(50, 200)}, ${random(
					50,
					200
				)})`,
			})
			.events((e) => {
				e.on("click", () => {
					ClientUtility.send(socket, ["channel_join", name]);
				});
			});
	}

	mine = new VNode("div");
	available = new VNode("ul").class("list");
	count = new VNode("span");

	constructor() {
		super("div");
		this.class("section", "channel-section");
		this.append(
			new VNode("div").append("Channels (", this.count, ")"),
			new VNode("hr"),
			this.available
		);
	}

	update() {
		this.updateAvailable();
		this.updateMine();
	}

	updateAvailable() {
		const channels = main_data.channels_available;
		const channel_items = Array.from(channels.keys()).map((name) => {
			return ChannelList.createItem(name);
		});
		this.available.setContent(channel_items);
		this.count.value(channels.size);
	}

	updateMine() {
		// const [_, channels] = packet;
	}
}

export class MainContainer extends VNode {
	constructor() {
		super("div");
		this.class("main-container");
	}
}

export class UserList extends VNode {
	static createItem(username: string): VNode {
		return new VNode("li")
			.class("user-ref")
			.style({
				color: `rgb(${random(50, 200)}, ${random(50, 200)}, ${random(
					50,
					200
				)})`,
			})
			.append(username);
	}

	contents = new VNode("ul").class("list");
	count = new VNode("span");

	constructor() {
		super("div");

		this.class("section", "user-section");

		this.append(
			new VNode("div").append("Users (", this.count, ")"),
			new VNode("hr"),
			this.contents
		);
	}

	update() {
		const channel_name = main_data.current_channel;
		if (channel_name == undefined) return;

		const channel = main_data.channels.get(channel_name);
		if (channel == undefined) return;

		this.count.value(channel.users.length);

		this.contents.setContent(
			channel.users.map((username) => {
				return UserList.createItem(username);
			})
		);
	}
}

export class MessageList extends VNode {
	static createItem(options: {
		username?: string;
		message: string;
		timestamp?: number;
	}) {
		return new VNode("div").class("message").append(
			new VNode("span")
				.class("message-username")
				.value(options.username ?? "**"),

			new VNode("span").class("message-content").value(options.message)
		);
	}

	static createInput() {
		return new VNode("input")
			.attr({
				placeholder: "Message",
			})
			.ref((input) => {
				input.events.on("keydown", (evt: KeyboardEvent) => {
					if (evt.key != "Enter") return;
					const value = input.value();
					input.value("");

					if (main_data.current_channel == undefined) return;

					ClientUtility.send(socket, [
						"message",
						main_data.current_channel,
						value,
					]);
				});
			});
	}

	contents = new VNode("div").class("list");
	count = new VNode("span");

	input = MessageList.createInput();

	constructor() {
		super("div");

		this.class("section", "message-section");

		this.append(
			new VNode("div").append(
				new VNode("div").append("Messages (", this.count, ")"),
				new VNode("hr"),
				this.contents
			),
			this.input
		);
	}

	reset() {
		this.count.value(0);
		this.contents.clear();
	}

	add(message: PacketFrom<OutboundPacket, "message">) {
		const [_, channel, content, options] = message;
		this.contents.append(
			MessageList.createItem({
				username: options.user_id,
				message: content,
				timestamp: options.timestamp,
			})
		);
	}
}
