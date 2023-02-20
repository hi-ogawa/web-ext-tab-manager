import browser from "webextension-polyfill";
import type { Endpoint } from "comlink";
import { DefaultMap, tinyassert } from "@hiogawa/utils";
import * as comlink from "comlink";
import * as superjson from "superjson";
import { generateId, sleep } from "./misc";
import EventEmitter from "eventemitter3";
import { logger } from "./logger";

// similar idea as https://github.com/GoogleChromeLabs/comlink/blob/dffe9050f63b1b39f30213adeb1dd4b9ed7d2594/src/node-adapter.ts#L24
function createComlinkEndpoint(port: browser.Runtime.Port): Endpoint {
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

//
// comlink.wrap/expose on top of browser.Runtime.Port
//

export async function wrapComlinkOnPort<T>(
  portName: string
): Promise<comlink.Remote<T>> {
  const port = await connectPort(portName);
  // TODO: ability to disconnect? `port.disconnect`
  const endpoint = createComlinkEndpoint(port);
  const proxy = comlink.wrap<T>(endpoint);
  return proxy;
}

export function exposeComlinkOnPort(portName: string, service: unknown) {
  return receivePort(portName, (port) => {
    comlink.expose(service, createComlinkEndpoint(port));
  });
}

//
// runtime.connect/onConnect wrapper
//

async function connectPort(portName: string): Promise<browser.Runtime.Port> {
  logger.debug("sharePort:register %s", portName);
  const port = browser.runtime.connect({ name: portName });
  await handshakeConnectPort(port);
  const onDisconnect = () => {
    logger.debug("connectPort:onDisconnect %s", portName);
    port.onDisconnect.removeListener(onDisconnect);
  };
  port.onDisconnect.addListener(onDisconnect);
  return port;
}

function receivePort(
  portName: string,
  onConnect: (port: browser.Runtime.Port) => void
) {
  logger.debug("receivePort:register %s", portName);
  const handler = async (port: browser.Runtime.Port) => {
    if (port.name === portName) {
      logger.debug("receivePort:handler %s", portName);
      const onDisconnect = () => {
        logger.debug("receivePort:onDisconnect %s", portName);
        port.onDisconnect.removeListener(onDisconnect);
      };
      port.onDisconnect.addListener(onDisconnect);
      await handshakeReceivePort(port);
      onConnect(port);
    }
  };
  browser.runtime.onConnect.addListener(handler);
  return () => {
    browser.runtime.onConnect.removeListener(handler);
  };
}

function receivePortOnce(portName: string): Promise<browser.Runtime.Port> {
  return new Promise((resolve) => {
    const unsubscribe = receivePort(portName, (port) => {
      unsubscribe();
      resolve(port);
    });
  });
}

const HANDSHAKE_ID = "HANDSHAKE_ID";
const HANDSHAKE_TIMEOUT = 1000;

async function handshakeConnectPort(port: browser.Runtime.Port): Promise<void> {
  const id = `handshake:${generateId()}`;
  const message = { [HANDSHAKE_ID]: id };
  const handshakePromise = new Promise<void>((resolve, reject) => {
    const handler = (reply: any) => {
      port.onMessage.removeListener(handler);
      if (reply[HANDSHAKE_ID] === id) {
        resolve();
      } else {
        reject(new Error("handshakeConnectPort"));
      }
    };
    port.onMessage.addListener(handler);
    port.postMessage(message);
  });
  const timeoutPromise = sleep(HANDSHAKE_TIMEOUT).then(() => {
    throw new Error("handshakeConnectPort:timeout");
  });
  return Promise.race([handshakePromise, timeoutPromise]);
}

async function handshakeReceivePort(port: browser.Runtime.Port): Promise<void> {
  const handshakePromise = new Promise<void>((resolve) => {
    const handler = (message: any) => {
      port.onMessage.removeListener(handler);
      port.postMessage(message); // reply message as is
      resolve();
    };
    port.onMessage.addListener(handler);
  });
  const timeoutPromise = sleep(HANDSHAKE_TIMEOUT).then(() => {
    throw new Error("handshakeReceivePort:timeout");
  });
  return Promise.race([handshakePromise, timeoutPromise]);
}

//
// ditch `comlink.proxy` based callback for more fine-grained port management
// cf. https://github.com/hi-ogawa/electron-vite-template/blob/24964f90afb9bfa9fb94ec17b39b24d3c2002d58/src/utils/comlink-event-utils.ts
//

export class PortEventEmitter {
  private eventEmitter = new EventEmitter();
  private portPromises = new Map<string, Promise<browser.Runtime.Port>>();
  private subscriptions = new DefaultMap<
    string,
    Map<string, { handler: any; port: browser.Runtime.Port }>
  >(() => new Map());

  emit(event: string, data?: unknown) {
    this.eventEmitter.emit(event, data);
  }

  // need to explicitly setup port before `on` to break race condition
  preparePort(portId: string) {
    tinyassert(!this.portPromises.get(portId));
    this.portPromises.set(portId, receivePortOnce(portId));
  }

  async on(type: string, portId: string) {
    tinyassert(!this.subscriptions.get(type).has(portId));
    const port = await this.portPromises.get(portId);
    tinyassert(port);
    const onEvent = (e: unknown) => {
      port.postMessage(e);
    };
    this.eventEmitter.on(type, onEvent);
    this.subscriptions.get(type).set(portId, { handler: onEvent, port });

    // force unsubscribe when port is closed
    const onDisconnect = () => {
      port.onDisconnect.removeListener(onDisconnect);
      this.off(type, portId);
    };
    port.onDisconnect.addListener(onDisconnect);
  }

  off(type: string, portId: string) {
    const subscription = this.subscriptions.get(type).get(portId);
    if (subscription) {
      this.subscriptions.get(type).delete(portId);
      this.eventEmitter.off(type, subscription.handler);
      subscription.port.disconnect();
    }
  }
}

export class PortEventEmitterRemote {
  constructor(private remote: comlink.Remote<PortEventEmitter>) {}

  // TODO: off
  async on(type: string, handler: (...args: any[]) => void) {
    const portId = `portId:${generateId()}`;
    await this.remote.preparePort(portId);
    const port = await connectPort(portId);
    await this.remote.on(type, portId);
    port.onMessage.addListener(handler);
  }
}
