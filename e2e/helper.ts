import { booleanGuard, tinyassert } from "@hiogawa/utils";
import { BrowserContext, chromium, test } from "@playwright/test";
import path from "node:path";
import process from "node:process";
import { retryPromise, sleep } from "../src/utils/misc";

// based on https://playwright.dev/docs/chrome-extensions

const EXTENSION_PATH =
  process.env["E2E_EXTENSION_PATH"] || path.join(__dirname, "..", "src", "dev");

export let EXTENSION: {
  id: string;
  manifest: any;
  optionsUrl: string;
  popupUrl: string;
};

export { testExtended as test };

const testExtended = test.extend({
  context: async ({ headless }, use) => {
    // launch chrome
    const context = await chromium.launchPersistentContext("", {
      headless: false,
      args: [
        headless && `--headless=new`,
        `--load-extension=${EXTENSION_PATH}`,
        `--disable-extensions-except=${EXTENSION_PATH}`,
      ].filter(booleanGuard),
    });

    // probe background page and collect extension metadata
    const background = await getBackground(context);
    const id = new URL(background.url()).host;
    // deal with some random race condition for manifest v3 (release build)
    await sleep(100);
    const manifest = await retryPromise(3)(() =>
      background.evaluate(() =>
        // @ts-expect-error
        chrome.runtime.getManifest()
      )
    );
    tinyassert(id);
    tinyassert(manifest);
    // prettier-ignore
    EXTENSION = {
      id,
      manifest,
      optionsUrl: `chrome-extension://${id}/${manifest.options_page}`,
      popupUrl: `chrome-extension://${id}/${(manifest.browser_action ?? manifest.action).default_popup}`,
    };

    // start test
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
