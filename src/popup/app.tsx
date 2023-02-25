import { booleanGuard, tinyassert } from "@hiogawa/utils";
import { Compose } from "@hiogawa/utils-react";
import browser from "webextension-polyfill";
import { CustomQueryClientProvider, ToasterWrapper } from "../components/misc";
import {
  tabManagerRemote,
  useTabManagerRemoteReady,
} from "../utils/tab-manager-remote";

export function App() {
  return (
    <Compose
      elements={[
        <CustomQueryClientProvider noDevTools />,
        <ToasterWrapper />,
        <AppInner />,
      ]}
    />
  );
}

function AppInner() {
  const tabManagerRemoteReadyQuery = useTabManagerRemoteReady();

  return (
    <div className="w-[200px] flex flex-col gap-2 m-2">
      <button
        className="antd-btn antd-btn-default"
        onClick={async (e) => {
          let tabs = await browser.tabs.query({
            currentWindow: true,
            pinned: false,
            active: true,
          });
          tabs = tabs.filter(
            (t) => !IGNORE_PATTERNS.some((p) => t.url?.startsWith(p))
          );
          const currentTab = tabs[0];
          if (currentTab) {
            await tabManagerRemote.addTabGroup([currentTab]);
            await tabManagerRemote.notify();
            if (!e.ctrlKey) {
              focusOrOpenOptionsPage(); // TODO: not working on manaifest v3
              await browser.tabs.remove([currentTab.id].filter(booleanGuard));
            }
          }
        }}
      >
        Save current tab
      </button>
      <button
        className="antd-btn antd-btn-default"
        onClick={async (e) => {
          let tabs = await browser.tabs.query({
            currentWindow: true,
            pinned: false,
          });
          tabs = tabs.filter(
            (t) => !IGNORE_PATTERNS.some((p) => t.url?.startsWith(p))
          );
          await tabManagerRemote.addTabGroup(tabs);
          await tabManagerRemote.notify();
          if (!e.ctrlKey) {
            focusOrOpenOptionsPage();
            await browser.tabs.remove(
              tabs.map((t) => t.id).filter(booleanGuard)
            );
          }
        }}
      >
        Save all tabs
      </button>
      <button
        className="antd-btn antd-btn-default"
        onClick={() => {
          browser.runtime.openOptionsPage();
        }}
      >
        Open options page
      </button>
      {tabManagerRemoteReadyQuery.isFetching && (
        <div className="absolute inset-0 bg-black/20 flex justify-center items-center">
          <div className="antd-spin w-10 h-10 text-black/60 border-2"></div>
        </div>
      )}
    </div>
  );
}

const IGNORE_PATTERNS = ["chrome://", "chrome-extension://"];

const MANIFEST = browser.runtime.getManifest();

// prettier-ignore
const OPTIONS_PAGE_URL = `chrome-extension://${browser.runtime.id}/${(MANIFEST as any).options_page}`;

// TODO: not working on manifest v3?
async function focusOrOpenOptionsPage() {
  const tabs = await browser.tabs.query({
    url: OPTIONS_PAGE_URL,
  });
  const tab = tabs[0];
  if (tab) {
    tinyassert(tab.id);
    tinyassert(tab.windowId);
    await browser.windows.update(tab.windowId, { focused: true });
    await browser.tabs.highlight({ windowId: tab.windowId, tabs: [tab.index] });
  } else {
    browser.runtime.openOptionsPage(); // TODO: no promise api?
  }
}
