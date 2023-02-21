import { exposeComlinkOnPort } from "../utils/comlink-utils";
import { initializeLogger } from "../utils/logger";
import { TabManager } from "../utils/tab-manager";
import { CONNECT_TAB_MANAGER } from "../utils/tab-manager-common";

async function main() {
  initializeLogger();
  const tabManager = await TabManager.load();
  await tabManager.updateCountBadge();
  exposeComlinkOnPort(CONNECT_TAB_MANAGER, tabManager);
}

main();
