import { useQuery } from "@tanstack/react-query";
import type { Remote } from "comlink";
import { toast } from "react-hot-toast";
import { PortEventEmitterRemote, wrapComlinkOnPort } from "./comlink-utils";
import { retryPromise } from "./misc";
import type { TabManager } from "./tab-manager";
import { CONNECT_TAB_MANAGER } from "./tab-manager-common";

export let tabManagerRemoteReady: Promise<boolean>;
export let tabManagerRemote: Remote<TabManager>;
export let tabManagerEventEmitterRemote: PortEventEmitterRemote;

export function initializeTabManagerRemote() {
  // retry to workaround race condition with background worker initialization
  tabManagerRemoteReady = retryPromise(3)(initializeTabManagerRemoteInternal);
}

async function initializeTabManagerRemoteInternal() {
  tabManagerRemote = await wrapComlinkOnPort<TabManager>(CONNECT_TAB_MANAGER);
  tabManagerEventEmitterRemote = new PortEventEmitterRemote(
    // @ts-expect-error wrong comlink typing
    tabManagerRemote.eventEmitter
  );
  return true;
}

export function useTabManagerRemoteReady() {
  return useQuery({
    queryKey: ["tabManagerRemoteReady"],
    queryFn: () => tabManagerRemoteReady,
    onError: () => {
      toast.error("failed to initialize extension");
    },
    staleTime: Infinity,
  });
}
