import type { Remote } from "comlink";
import { wrapComlinkOnPort, PortEventEmitterRemote } from "./comlink-utils";
import type { TabManager } from "./tab-manager";
import { CONNECT_TAB_MANAGER } from "./tab-manager-common";

export let tabManagerRemote: Remote<TabManager>;
export let tabManagerEventEmitterRemote: PortEventEmitterRemote;

export async function initializeTabManagerRemote() {
  tabManagerRemote = wrapComlinkOnPort<TabManager>(CONNECT_TAB_MANAGER);
  tabManagerEventEmitterRemote = new PortEventEmitterRemote(
    // @ts-expect-error wrong comlink typing
    tabManagerRemote.eventEmitter
  );
}
