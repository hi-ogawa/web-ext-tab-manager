import { exposeComlinkService } from "../utils/comlink-utils";
import { initializeLogger } from "../utils/logger";
import { TabManager } from "../utils/tab-manager";
import { CONNECT_TAB_MANAGER } from "../utils/tab-manager-common";

async function main() {
  initializeLogger();
  const tabManager = await TabManager.load();
  exposeComlinkService(CONNECT_TAB_MANAGER, tabManager);
}

main();
