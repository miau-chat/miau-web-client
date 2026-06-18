import { PacketOf, InboundPacket, OutboundPacket } from "./packets.js";
import { inbound_schemas, outbound_schemas } from "./schemas.js";
import { SanitySchema } from "./util/schema.js";

export class PacketFormatter {
	static readonly NEWLINE: string = "\r\n";

	static escape(text: string) {
		return text.replace(/\|/g, "\\|");
	}

	static splitEscaped(input: string) {
		const result: string[] = [];
		let current: string = "";
		let escaping: boolean = false;
		for (let char of input.split("")) {
			if (escaping) {
				current += char;
				escaping = false;
				continue;
			} else if (char === "\\") {
				escaping = true;
				continue;
			} else if (char === "|") {
				result.push(current.trim());
				current = "";
				continue;
			}
			current += char;
		}
		result.push(current.trim());
		return result;
	}

	static toString<T extends InboundPacket | OutboundPacket>(
		input: PacketOf<T>
	) {
		return input.map((value) => PacketFormatter.escape(value)).join("|");
	}

	/**
	 * @param buffer
	 * @param data
	 * @param callback
	 * @returns - buffer data
	 */
	static parseLines(
		buffer: string,
		data: string,
		callback: (line: string) => void
	): string {
		buffer += data;

		while (buffer.includes(PacketFormatter.NEWLINE)) {
			const index = buffer.indexOf(PacketFormatter.NEWLINE);
			const line = buffer.slice(0, index).trim();
			buffer = buffer.slice(index + 2);

			if (line) callback(line);
		}

		return buffer;
	}

	static validateInbound(input: object): InboundPacket | undefined {
		let data: InboundPacket = input as any;
		if (Array.isArray(data) != true) return;

		if (inbound_schemas?.[data[0]] != undefined) {
			const parsed = SanitySchema.safeParse(
				inbound_schemas[data[0]],
				data as any
			);
			if (parsed.success) {
				return parsed.data as unknown as InboundPacket;
			}
		}
	}

	static validateOutbound(input: object): OutboundPacket | undefined {
		let data: OutboundPacket = input as any;
		if (Array.isArray(data) != true) return;

		if (outbound_schemas?.[data[0]] != undefined) {
			const parsed = SanitySchema.safeParse(
				outbound_schemas[data[0]],
				data as any
			);
			if (parsed.success) {
				return parsed.data as unknown as OutboundPacket;
			}
		}
	}
}
