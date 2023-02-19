import { exposeComlinkService } from "../utils/comlink-utils";
import { TabManager } from "../utils/tab-manager";
import { CONNECT_TAB_MANAGER } from "../utils/tab-manager-common";

async function main() {
  const tabManager = await TabManager.load();
  exposeComlinkService(CONNECT_TAB_MANAGER, tabManager);
}

main();
