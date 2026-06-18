import { ClientUtility } from "./utility.js";

export const socket = new WebSocket("ws://127.0.0.1:6942");

socket.addEventListener("open", () => {
	ClientUtility.send(socket, ["ready"]);
});
socket.addEventListener("message", (event) => {
	let data;

	try {
		data = JSON.parse(event.data);
		ClientUtility.handlePacket(data);
	} catch (e) {}
});
socket.addEventListener("error", () => {});
socket.addEventListener("close", () => {});
