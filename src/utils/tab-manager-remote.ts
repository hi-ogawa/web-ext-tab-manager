import type { Remote } from "comlink";
import { createComlinkProxy } from "./comlink-utils";
import { CONNECT_TAB_MANAGER, TabManager } from "./tab-manager";

export let tabManagerRemote: Remote<TabManager>;

export async function initializeTabManagerRemote() {
  // TODO: check comlink is ready (e.g. by dedicated "ping" call?)
  tabManagerRemote = createComlinkProxy<TabManager>(CONNECT_TAB_MANAGER);
}
