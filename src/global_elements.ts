import {
	ChannelList,
	MainContainer,
	MessageList,
	UserList,
} from "./components.js";

export const user_list = new UserList();
export const message_list = new MessageList();
export const channel_list = new ChannelList();

export const main_container = new MainContainer().append(
	channel_list,
	user_list,
	message_list
);