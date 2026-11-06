import { create } from "zustand";
import {
  Collection,
  Environment,
  HistoryEntry,
  HttpRequest,
  HttpResponse,
  KeyValue,
  SavedRequest,
} from "../types";
import {
  executeHttpRequest,
  loadWorkspaceData,
  saveWorkspaceData,
  generateCurlCommand,
  parseCurlCommand,
  importPostmanCollection,
  exportPostmanCollection,
  downloadJsonFile,
} from "../services/tauri";

export type SidebarTab = "collections" | "environments" | "history";
export type RequestTab = "params" | "headers" | "auth" | "body";
export type ResponseTab = "body" | "headers" | "raw" | "preview";

export interface TabItem {
  id: string;
  savedRequestId?: string;
  name: string;
  request: HttpRequest;
  response: HttpResponse | null;
  isLoading: boolean;
  error: string | null;
  isDirty?: boolean;
}

interface AppState {
  // Tabs management (Multi-Tab Workbench like Postman & Dia)
  tabs: TabItem[];
  activeTabId: string;
  openNewTab: (initialReq?: Partial<HttpRequest>, name?: string) => void;
  closeTab: (tabId: string) => void;
  setActiveTabId: (tabId: string) => void;
  updateActiveTabName: (name: string) => void;

  // Active Request Helpers
  getActiveTab: () => TabItem;
  setRequest: (updater: (prev: HttpRequest) => HttpRequest) => void;
  updateMethod: (method: string) => void;
  updateUrl: (url: string) => void;
  updateParams: (params: KeyValue[]) => void;

  // Execution
  executeActiveRequest: () => Promise<void>;

  // Sub-tabs
  sidebarTab: SidebarTab;
  setSidebarTab: (tab: SidebarTab) => void;
  requestTab: RequestTab;
  setRequestTab: (tab: RequestTab) => void;
  responseTab: ResponseTab;
  setResponseTab: (tab: ResponseTab) => void;

  // Layout & Overlays
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  isCommandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  isImportModalOpen: boolean;
  setImportModalOpen: (open: boolean) => void;

  // Workspace Data
  collections: Collection[];
  environments: Environment[];
  history: HistoryEntry[];
  activeEnvironmentId: string | null;
  setActiveEnvironmentId: (id: string | null) => void;

  // Actions
  initWorkspace: () => Promise<void>;
  saveCurrentRequest: (name: string, collectionId: string) => Promise<void>;
  loadSavedRequest: (saved: SavedRequest) => void;
  createCollection: (name: string) => Promise<void>;
  createEnvironment: (name: string) => Promise<void>;
  updateEnvironmentVariables: (envId: string, variables: KeyValue[]) => Promise<void>;
  importPostman: (jsonStr: string) => Promise<void>;
  exportPostman: (collectionId: string) => Promise<void>;
  exportWorkspace: () => void;
  importCurl: (curlStr: string) => Promise<void>;
  exportCurl: () => Promise<string>;
}

const defaultRequest: HttpRequest = {
  method: "GET",
  url: "https://httpbin.org/get?source=reqcraft",
  headers: [{ key: "Accept", value: "application/json", enabled: true }],
  query_params: [{ key: "source", value: "reqcraft", enabled: true }],
  body_type: "none",
  body: undefined,
  auth: { type: "None" },
  timeout_ms: 30000,
};

const initialTabId = "tab-init";
const initialTab: TabItem = {
  id: initialTabId,
  name: "Get JSON Echo",
  request: defaultRequest,
  response: null,
  isLoading: false,
  error: null,
  isDirty: false,
};

// Helper to parse query parameters from URL string
function parseQueryParamsFromUrl(urlStr: string): KeyValue[] {
  try {
    const qIndex = urlStr.indexOf("?");
    if (qIndex === -1) return [];
    const search = urlStr.substring(qIndex + 1);
    const searchParams = new URLSearchParams(search);
    const params: KeyValue[] = [];
    searchParams.forEach((val, key) => {
      params.push({ key, value: val, enabled: true });
    });
    return params;
  } catch {
    return [];
  }
}

// Helper to rebuild URL query string from params array
function rebuildUrlWithParams(baseUrlStr: string, params: KeyValue[]): string {
  try {
    const qIndex = baseUrlStr.indexOf("?");
    const base = qIndex !== -1 ? baseUrlStr.substring(0, qIndex) : baseUrlStr;
    const activeParams = params.filter((p) => p.enabled && p.key.trim().length > 0);
    if (activeParams.length === 0) return base;

    const searchParams = new URLSearchParams();
    activeParams.forEach((p) => {
      searchParams.append(p.key.trim(), p.value);
    });

    const queryString = searchParams.toString();
    return queryString ? `${base}?${queryString}` : base;
  } catch {
    return baseUrlStr;
  }
}

export const useStore = create<AppState>((set, get) => ({
  tabs: [initialTab],
  activeTabId: initialTabId,

  sidebarTab: "collections",
  setSidebarTab: (tab) => set({ sidebarTab: tab }),
  requestTab: "params",
  setRequestTab: (tab) => set({ requestTab: tab }),
  responseTab: "body",
  setResponseTab: (tab) => set({ responseTab: tab }),

  isSidebarOpen: true,
  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
  isCommandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
  isImportModalOpen: false,
  setImportModalOpen: (open) => set({ isImportModalOpen: open }),

  collections: [],
  environments: [],
  history: [],
  activeEnvironmentId: null,
  setActiveEnvironmentId: (id) => set({ activeEnvironmentId: id }),

  getActiveTab: () => {
    const { tabs, activeTabId } = get();
    return tabs.find((t) => t.id === activeTabId) || tabs[0] || initialTab;
  },

  openNewTab: (initialReq, name) => {
    const newId = `tab-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newTab: TabItem = {
      id: newId,
      name: name || "Untitled Request",
      request: initialReq ? { ...defaultRequest, ...initialReq } : { ...defaultRequest },
      response: null,
      isLoading: false,
      error: null,
      isDirty: false,
    };
    set((s) => ({
      tabs: [...s.tabs, newTab],
      activeTabId: newId,
    }));
  },

  closeTab: (tabId) => {
    const { tabs, activeTabId } = get();
    if (tabs.length <= 1) {
      // Don't close the last tab, reset it
      const resetId = `tab-${Date.now()}`;
      set({
        tabs: [
          {
            id: resetId,
            name: "Untitled Request",
            request: { ...defaultRequest },
            response: null,
            isLoading: false,
            error: null,
            isDirty: false,
          },
        ],
        activeTabId: resetId,
      });
      return;
    }

    const filtered = tabs.filter((t) => t.id !== tabId);
    let nextActiveId = activeTabId;
    if (activeTabId === tabId) {
      const closedIndex = tabs.findIndex((t) => t.id === tabId);
      const nextIndex = Math.max(0, closedIndex - 1);
      nextActiveId = filtered[nextIndex]?.id || filtered[0].id;
    }

    set({ tabs: filtered, activeTabId: nextActiveId });
  },

  setActiveTabId: (tabId) => set({ activeTabId: tabId }),

  updateActiveTabName: (name) => {
    const { activeTabId } = get();
    set((s) => ({
      tabs: s.tabs.map((t) => (t.id === activeTabId ? { ...t, name, isDirty: true } : t)),
    }));
  },

  setRequest: (updater) => {
    const { activeTabId } = get();
    set((s) => ({
      tabs: s.tabs.map((t) =>
        t.id === activeTabId
          ? { ...t, request: updater(t.request), isDirty: true }
          : t
      ),
    }));
  },

  updateMethod: (method) => {
    const { activeTabId } = get();
    set((s) => ({
      tabs: s.tabs.map((t) =>
        t.id === activeTabId
          ? {
              ...t,
              request: { ...t.request, method: method.toUpperCase() },
              isDirty: true,
            }
          : t
      ),
    }));
  },

  // Bidirectional URL sync: typing ?a=1 in URL updates params table
  updateUrl: (url) => {
    const { activeTabId } = get();
    const parsedParams = parseQueryParamsFromUrl(url);

    set((s) => ({
      tabs: s.tabs.map((t) => {
        if (t.id !== activeTabId) return t;
        return {
          ...t,
          request: {
            ...t.request,
            url,
            query_params: parsedParams.length > 0 ? parsedParams : t.request.query_params,
          },
          isDirty: true,
        };
      }),
    }));
  },

  // Bidirectional Params sync: editing table updates URL string
  updateParams: (params) => {
    const { activeTabId } = get();
    set((s) => ({
      tabs: s.tabs.map((t) => {
        if (t.id !== activeTabId) return t;
        const newUrl = rebuildUrlWithParams(t.request.url, params);
        return {
          ...t,
          request: {
            ...t.request,
            url: newUrl,
            query_params: params,
          },
          isDirty: true,
        };
      }),
    }));
  },

  executeActiveRequest: async () => {
    const { activeTabId, getActiveTab, activeEnvironmentId, environments, history, collections } =
      get();
    const activeTab = getActiveTab();
    const req = activeTab.request;

    // Set loading on active tab
    set((s) => ({
      tabs: s.tabs.map((t) =>
        t.id === activeTabId ? { ...t, isLoading: true, error: null } : t
      ),
    }));

    try {
      // Resolve environment variables like {{baseUrl}}
      let resolvedUrl = req.url;
      let resolvedHeaders = [...req.headers];
      let resolvedBody = req.body;

      const activeEnv = environments.find((e) => e.id === activeEnvironmentId);
      if (activeEnv) {
        for (const v of activeEnv.variables) {
          if (v.enabled && v.key.trim()) {
            const regex = new RegExp(`{{\\s*${v.key.trim()}\\s*}}`, "g");
            resolvedUrl = resolvedUrl.replace(regex, v.value);
            resolvedHeaders = resolvedHeaders.map((h) => ({
              ...h,
              value: h.value.replace(regex, v.value),
            }));
            if (resolvedBody) {
              resolvedBody = resolvedBody.replace(regex, v.value);
            }
          }
        }
      }

      const reqToExecute = {
        ...req,
        url: resolvedUrl,
        headers: resolvedHeaders,
        body: resolvedBody,
      };

      const resp = await executeHttpRequest(reqToExecute);

      // Add to history
      const newHistoryItem: HistoryEntry = {
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
        request: reqToExecute,
        response: resp,
        executed_at: new Date().toISOString(),
      };

      const updatedHistory = [newHistoryItem, ...history.slice(0, 99)];

      set((s) => ({
        tabs: s.tabs.map((t) =>
          t.id === activeTabId
            ? { ...t, response: resp, isLoading: false, error: null }
            : t
        ),
        history: updatedHistory,
      }));

      // Persist history
      saveWorkspaceData({
        collections,
        environments,
        history: updatedHistory,
      }).catch(console.error);
    } catch (err: any) {
      set((s) => ({
        tabs: s.tabs.map((t) =>
          t.id === activeTabId
            ? { ...t, isLoading: false, error: err?.message || String(err) }
            : t
        ),
      }));
    }
  },

  initWorkspace: async () => {
    try {
      const data = await loadWorkspaceData();
      const activeEnv =
        data.environments.find((e) => e.is_active)?.id || (data.environments[0]?.id ?? null);

      set({
        collections: data.collections,
        environments: data.environments,
        history: data.history,
        activeEnvironmentId: activeEnv,
      });

      // Load first saved request into active tab if present
      const firstReq = data.collections[0]?.requests[0];
      if (firstReq) {
        set({
          tabs: [
            {
              id: "tab-1",
              savedRequestId: firstReq.id,
              name: firstReq.name,
              request: { ...firstReq.request },
              response: null,
              isLoading: false,
              error: null,
              isDirty: false,
            },
          ],
          activeTabId: "tab-1",
        });
      }
    } catch (err: any) {
      console.error("Failed to load workspace data:", err);
    }
  },

  saveCurrentRequest: async (name: string, collectionId: string) => {
    const { activeTabId, getActiveTab, collections, environments, history } = get();
    const activeTab = getActiveTab();
    const now = new Date().toISOString();
    const id = activeTab.savedRequestId || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()));

    const newSaved: SavedRequest = {
      id,
      name,
      request: { ...activeTab.request },
      created_at: now,
      updated_at: now,
    };

    const updatedCols = collections.map((col) => {
      if (col.id === collectionId) {
        const existingIdx = col.requests.findIndex((r) => r.id === id);
        let updatedReqs = [...col.requests];
        if (existingIdx !== -1) {
          updatedReqs[existingIdx] = newSaved;
        } else {
          updatedReqs.push(newSaved);
        }
        return {
          ...col,
          requests: updatedReqs,
          updated_at: now,
        };
      }
      return col;
    });

    set((s) => ({
      collections: updatedCols,
      tabs: s.tabs.map((t) =>
        t.id === activeTabId
          ? { ...t, name, savedRequestId: id, isDirty: false }
          : t
      ),
    }));

    await saveWorkspaceData({
      collections: updatedCols,
      environments,
      history,
    });
  },

  loadSavedRequest: (saved: SavedRequest) => {
    const { tabs } = get();
    // Check if request is already open in a tab
    const existingTab = tabs.find((t) => t.savedRequestId === saved.id);
    if (existingTab) {
      set({ activeTabId: existingTab.id });
      return;
    }

    // Open new tab
    const newId = `tab-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newTab: TabItem = {
      id: newId,
      savedRequestId: saved.id,
      name: saved.name,
      request: { ...saved.request },
      response: null,
      isLoading: false,
      error: null,
      isDirty: false,
    };

    set({
      tabs: [...tabs, newTab],
      activeTabId: newId,
    });
  },

  createCollection: async (name: string) => {
    const { collections, environments, history } = get();
    const now = new Date().toISOString();
    const newCol: Collection = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      name,
      description: "",
      requests: [],
      created_at: now,
      updated_at: now,
    };

    const updatedCols = [...collections, newCol];
    set({ collections: updatedCols });

    await saveWorkspaceData({
      collections: updatedCols,
      environments,
      history,
    });
  },

  createEnvironment: async (name: string) => {
    const { collections, environments, history } = get();
    const newEnv: Environment = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      name,
      variables: [{ key: "baseUrl", value: "https://api.example.com", enabled: true }],
      is_active: false,
    };

    const updatedEnvs = [...environments, newEnv];
    set({ environments: updatedEnvs, activeEnvironmentId: newEnv.id });

    await saveWorkspaceData({
      collections,
      environments: updatedEnvs,
      history,
    });
  },

  updateEnvironmentVariables: async (envId: string, variables: KeyValue[]) => {
    const { collections, environments, history } = get();
    const updatedEnvs = environments.map((e) => (e.id === envId ? { ...e, variables } : e));
    set({ environments: updatedEnvs });

    await saveWorkspaceData({
      collections,
      environments: updatedEnvs,
      history,
    });
  },

  importPostman: async (jsonStr: string) => {
    try {
      const col = await importPostmanCollection(jsonStr);
      const { collections, environments, history } = get();
      const updatedCols = [...collections, col];
      set({ collections: updatedCols });

      await saveWorkspaceData({
        collections: updatedCols,
        environments,
        history,
      });

      if (col.requests.length > 0) {
        get().loadSavedRequest(col.requests[0]);
      }
    } catch (err: any) {
      alert(`Import failed: ${err}`);
    }
  },

  exportPostman: async (collectionId: string) => {
    const { collections } = get();
    const col = collections.find((c) => c.id === collectionId);
    if (!col) return;

    try {
      const json = await exportPostmanCollection(col);
      const safeName = col.name.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
      downloadJsonFile(`${safeName}.postman_collection.json`, json);
    } catch (err: any) {
      alert(`Export failed: ${err}`);
    }
  },

  exportWorkspace: () => {
    const { collections, environments, history } = get();
    const fullData = { collections, environments, history };
    downloadJsonFile("reqcraft_workspace.json", JSON.stringify(fullData, null, 2));
  },

  importCurl: async (curlStr: string) => {
    try {
      const parsed = await parseCurlCommand(curlStr);
      get().openNewTab(parsed, "Imported cURL");
    } catch (err: any) {
      alert(`cURL import failed: ${err}`);
    }
  },

  exportCurl: async () => {
    const { getActiveTab } = get();
    return await generateCurlCommand(getActiveTab().request);
  },
}));
