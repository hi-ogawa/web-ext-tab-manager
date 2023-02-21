import browser from "webextension-polyfill";
import * as superjson from "superjson";
import { generateId } from "./misc";
import { pick } from "lodash";
import { z } from "zod";
import { PortEventEmitter } from "./comlink-utils";
import { EVENT_NOTIFY } from "./tab-manager-common";
import { booleanGuard } from "@hiogawa/utils";

const STORAGE_KEY = "__TabManager_3";
const STORAGE_PROPS: (keyof TabManager)[] = ["groups"];

export class TabManager {
  groups: SavedTabGroup[] = [];
  eventEmitter = new PortEventEmitter();

  //
  // persistence
  //

  serialize(): string {
    return superjson.stringify(pick(this, STORAGE_PROPS));
  }

  static deserialize(serialized: string): TabManager {
    const instance = new TabManager();
    Object.assign(instance, superjson.parse(serialized));
    return instance;
  }

  static async load(): Promise<TabManager> {
    const record = await browser.storage.local.get(STORAGE_KEY);
    const serialized = record[STORAGE_KEY];
    if (serialized) {
      return this.deserialize(serialized);
    }
    return new TabManager();
  }

  async save(): Promise<void> {
    const serialized = this.serialize();
    await browser.storage.local.set({ [STORAGE_KEY]: serialized });
  }

  //
  // api
  //

  ping(): boolean {
    return true;
  }

  runImport(serialized: string) {
    const groups = deserializeExport(serialized);
    this.groups = groups.concat(this.groups);
    this.save();
  }

  runExport(): string {
    return serializeExport(this.groups);
  }

  notify() {
    this.eventEmitter.emit(EVENT_NOTIFY);
  }

  getTabGroups(): SavedTabGroup[] {
    return this.groups;
  }

  addTabGroup(tabs: browser.Tabs.Tab[]) {
    const group: SavedTabGroup = {
      id: generateId(),
      createdAt: new Date(),
      tabs: tabs.map(toSavedTab),
    };
    this.groups.unshift(group);
    this.save();
  }

  deleteTabGroup(id: string) {
    this.groups = this.groups.filter((g) => g.id !== id);
    this.save();
  }

  async restoreTabGroup(id: string) {
    const group = this.groups.find((g) => g.id === id);
    if (group) {
      await browser.windows.create({
        url: group.tabs.map((t) => t.url).filter(booleanGuard),
      });
    }
  }

  delteTab(id: string, index: number) {
    const group = this.groups.find((g) => g.id === id);
    if (group) {
      group.tabs.splice(index, 1);
      if (group.tabs.length === 0) {
        this.groups = this.groups.filter((g) => g.id !== id);
      }
    }
    this.save();
  }
}

interface SavedTabGroup {
  id: string;
  createdAt: Date;
  tabs: SavedTab[];
}

interface SavedTab {
  id: string;
  url?: string;
  title?: string;
  favIconUrl?: string;
}

function toSavedTab(tab: browser.Tabs.Tab): SavedTab {
  return {
    id: generateId(),
    url: tab.url,
    title: tab.title,
    favIconUrl: tab.favIconUrl,
  };
}

const Z_EXPORT_DATA = z.object({
  groups: z
    .object({
      createdAt: z
        .string()
        .transform((s) => new Date(s))
        .refine((d) => !isNaN(d.getTime()))
        .optional(),
      tabs: z
        .object({
          url: z.string().optional(),
          title: z.string().optional(),
          favIconUrl: z.string().optional(),
        })
        .array(),
    })
    .array(),
});

function serializeExport(groups: SavedTabGroup[]): string {
  const exportData: z.input<typeof Z_EXPORT_DATA> = {
    groups: groups.map((g) => ({
      createdAt: g.createdAt.toISOString(),
      tabs: g.tabs.map((t) => ({
        url: t.url,
        title: t.title,
        favIconUrl: t.favIconUrl,
      })),
    })),
  };
  return JSON.stringify(exportData, null, 2);
}

function deserializeExport(serialized: string): SavedTabGroup[] {
  const parsed = Z_EXPORT_DATA.parse(JSON.parse(serialized));
  const now = new Date();
  const groups: SavedTabGroup[] = parsed.groups.map((g) => ({
    id: generateId(),
    createdAt: g.createdAt ?? now,
    tabs: g.tabs.map((t) => ({
      ...t,
      id: generateId(),
    })),
  }));
  return groups;
}
