import { VNode } from "@orago/dom";
import { main_container } from "./global_elements.js";
import "./networking/websocket-client.js";
import "./styles/index.css";

const body = VNode.from(document.body);

body.append(main_container);

