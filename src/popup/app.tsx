import { Compose } from "@hiogawa/utils-react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import browser from "webextension-polyfill";
import { CustomQueryClientProvider, ToasterWrapper } from "../components/misc";
import { isNonNil } from "../utils/misc";
import { tabManagerRemote } from "../utils/tab-manager-remote";

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
  const pingQuery = useQuery({
    queryKey: ["ping"],
    queryFn: () => tabManagerRemote.ping(),
    onError: (e) => {
      toast.error("ping: " + String(e));
    },
  });

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
              // TODO: focus on existing options page if there's one already
              browser.runtime.openOptionsPage(); // TODO: no promise?
              await browser.tabs.remove([currentTab.id].filter(isNonNil));
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
            browser.runtime.openOptionsPage();
            await browser.tabs.remove(tabs.map((t) => t.id).filter(isNonNil));
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
      {pingQuery.isFetching && (
        <div className="absolute inset-0 bg-black/20 flex justify-center items-center">
          <div className="antd-spin w-10 h-10 text-black/60 border-2"></div>
        </div>
      )}
    </div>
  );
}

const IGNORE_PATTERNS = [
  "chrome://newtab/",
  `chrome-extension://${browser.runtime.id}/`,
];
