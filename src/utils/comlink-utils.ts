import browser from "webextension-polyfill";
import type { Endpoint } from "comlink";
import { tinyassert } from "@hiogawa/utils";
import * as comlink from "comlink";
import * as superjson from "superjson";
import { generateId } from "./misc";

// similar idea as https://github.com/GoogleChromeLabs/comlink/blob/dffe9050f63b1b39f30213adeb1dd4b9ed7d2594/src/node-adapter.ts#L24
export function createComlinkEndpoint(port: browser.Runtime.Port): Endpoint {
  const listerMap = new WeakMap<object, any>();

  return {
    postMessage: (message: any, transfer?: Transferable[]) => {
      tinyassert((transfer ?? []).length === 0);
      message = superjson.stringify(message); // support sending e.g. Date
      port.postMessage(message);
    },

    addEventListener: (
      type: string,
      listener: EventListenerOrEventListenerObject,
      _options?: {}
    ) => {
      tinyassert(type === "message");
      const wrapper = (message: any, _port: browser.Runtime.Port) => {
        message = superjson.parse(message);
        const comlinkEvent = { data: message } as MessageEvent;
        if ("handleEvent" in listener) {
          listener.handleEvent(comlinkEvent);
        } else {
          listener(comlinkEvent);
        }
      };
      port.onMessage.addListener(wrapper);
      listerMap.set(listener, wrapper);
    },

    removeEventListener: (
      type: string,
      listener: EventListenerOrEventListenerObject,
      _options?: {}
    ) => {
      tinyassert(type === "message");
      const wrapper = listerMap.get(listener);
      if (wrapper) {
        port.onMessage.removeListener(wrapper);
        listerMap.delete(listener);
      }
    },
  };
}

export function createComlinkProxy<T>(portName: string): comlink.Remote<T> {
  const port = browser.runtime.connect({ name: portName });
  // TODO: disconnect
  port.disconnect;
  const endpoint = createComlinkEndpoint(port);
  const proxy = comlink.wrap<T>(endpoint);
  return proxy;
}

export function exposeComlinkService(portName: string, service: unknown) {
  const handler = (port: browser.Runtime.Port) => {
    if (port.name === portName) {
      comlink.expose(service, createComlinkEndpoint(port));
      // TODO: something to cleanup on disconnect?
      port.onDisconnect;
      return;
    }
  };
  browser.runtime.onConnect.addListener(handler);
  return () => {
    browser.runtime.onConnect.removeListener(handler);
  };
}

// TODO: give up using `comlink.proxy` for finer/controlled management of ports
//       cf. https://github.com/hi-ogawa/electron-vite-template/blob/24964f90afb9bfa9fb94ec17b39b24d3c2002d58/src/utils/comlink-event-utils.ts

// porting https://github.com/GoogleChromeLabs/comlink/blob/dffe9050f63b1b39f30213adeb1dd4b9ed7d2594/src/comlink.ts#L209
// since `browser.Runtime.Port` doesn't support "transfer"
const myProxyTransferHandler: comlink.TransferHandler<any, string> = {
  canHandle: (value: unknown): value is any => {
    return Boolean(
      value &&
        (typeof value === "object" || typeof value === "function") &&
        comlink.proxyMarker in value
    );
  },

  serialize: (value: any): [string, Transferable[]] => {
    const portName = `proxy-port-${generateId()}`;
    const unsubscribe = exposeComlinkService(portName, value);
    // TODO: how to unsubscribe? probably leaks a lot especially during hmr dev
    //       special "releaseProxy" message for this purpose? https://github.com/GoogleChromeLabs/comlink/blob/dffe9050f63b1b39f30213adeb1dd4b9ed7d2594/src/comlink.ts#L457
    unsubscribe;
    return [portName, []];
  },

  deserialize: (portName: string): any => {
    return createComlinkProxy(portName);
  },
};

comlink.transferHandlers.set("proxy", myProxyTransferHandler);
