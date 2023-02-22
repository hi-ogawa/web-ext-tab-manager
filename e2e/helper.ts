import { test, chromium, BrowserContext } from "@playwright/test";
import path from "node:path";
import { tinyassert } from "@hiogawa/utils";

const EXTENSION_PATH = path.join(__dirname, "..", "src", "dev");

export let EXTENSION_ID: string;
export let EXTENSION_URL: string;
export let OPTIONS_PAGE_URL: string; // TODO: same directory structure for dev/prod
export let POPUP_PAGE_URL: string;
export let EXTENSION_MANIFEST: unknown;

export { testExtended as test };

const testExtended = test.extend({
  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext("", {
      headless: false,
      args: [
        `--load-extension=${EXTENSION_PATH}`,
        `--disable-extensions-except=${EXTENSION_PATH}`,
      ],
    });
    const background = await getBackground(context);
    EXTENSION_MANIFEST = await background.evaluate(() =>
      // @ts-expect-error
      chrome.runtime.getManifest()
    );
    EXTENSION_ID = new URL(background.url()).host;
    EXTENSION_URL = `chrome-extension://${EXTENSION_ID}`;
    tinyassert(EXTENSION_ID);
    await use(context);
    await context.close();
  },
});

async function getBackground(context: BrowserContext) {
  const background = await Promise.race([
    context.waitForEvent("backgroundpage"),
    context.waitForEvent("serviceworker"),
    promiseResolveDefined(() => context.serviceWorkers()[0]),
    promiseResolveDefined(() => context.backgroundPages()[0]),
    promiseRejectTimeout(500),
  ]);
  return background;
}

//
// promise utils
//

async function promiseResolveDefined<T>(f: () => T | undefined): Promise<T> {
  return new Promise((resolve) => {
    const v = f();
    if (v) {
      resolve(v);
    }
  });
}

async function promiseRejectTimeout(ms: number): Promise<never> {
  await sleep(ms);
  throw new Error("promiseRejectTimeout");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
