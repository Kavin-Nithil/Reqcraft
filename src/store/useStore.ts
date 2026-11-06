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
} from "../services/tauri";

export type SidebarTab = "collections" | "environments" | "history";
export type RequestTab = "params" | "headers" | "auth" | "body";
export type ResponseTab = "body" | "headers" | "raw";

interface AppState {
  // Active Request
  activeRequestId: string | null;
  activeRequestName: string;
  request: HttpRequest;
  setRequest: (updater: (prev: HttpRequest) => HttpRequest) => void;
  updateMethod: (method: string) => void;
  updateUrl: (url: string) => void;

  // Active Response
  response: HttpResponse | null;
  isLoading: boolean;
  error: string | null;
  executeActiveRequest: () => Promise<void>;

  // Tabs & Views
  sidebarTab: SidebarTab;
  setSidebarTab: (tab: SidebarTab) => void;
  requestTab: RequestTab;
  setRequestTab: (tab: RequestTab) => void;
  responseTab: ResponseTab;
  setResponseTab: (tab: ResponseTab) => void;

  // Modals & Panels
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
  importCurl: (curlStr: string) => Promise<void>;
  exportCurl: () => Promise<string>;
}

const defaultRequest: HttpRequest = {
  method: "GET",
  url: "https://httpbin.org/get",
  headers: [{ key: "Accept", value: "application/json", enabled: true }],
  query_params: [{ key: "source", value: "reqcraft", enabled: true }],
  body_type: "none",
  body: undefined,
  auth: { type: "None" },
  timeout_ms: 30000,
};

export const useStore = create<AppState>((set, get) => ({
  activeRequestId: null,
  activeRequestName: "Untitled Request",
  request: defaultRequest,
  response: null,
  isLoading: false,
  error: null,

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

  setRequest: (updater) => set((s) => ({ request: updater(s.request) })),
  updateMethod: (method) =>
    set((s) => ({ request: { ...s.request, method: method.toUpperCase() } })),
  updateUrl: (url) => set((s) => ({ request: { ...s.request, url } })),

  initWorkspace: async () => {
    try {
      const data = await loadWorkspaceData();
      const activeEnv = data.environments.find((e) => e.is_active)?.id || (data.environments[0]?.id ?? null);
      set({
        collections: data.collections,
        environments: data.environments,
        history: data.history,
        activeEnvironmentId: activeEnv,
      });

      // Load first request if available
      const firstReq = data.collections[0]?.requests[0];
      if (firstReq) {
        set({
          activeRequestId: firstReq.id,
          activeRequestName: firstReq.name,
          request: firstReq.request,
        });
      }
    } catch (err: any) {
      console.error("Failed to load workspace data:", err);
    }
  },

  executeActiveRequest: async () => {
    const { request, activeEnvironmentId, environments, history, collections } = get();
    set({ isLoading: true, error: null });

    try {
      // Resolve environment variables like {{baseUrl}}
      let resolvedUrl = request.url;
      const activeEnv = environments.find((e) => e.id === activeEnvironmentId);
      if (activeEnv) {
        for (const v of activeEnv.variables) {
          if (v.enabled && v.key.trim()) {
            const regex = new RegExp(`{{\\s*${v.key.trim()}\\s*}}`, "g");
            resolvedUrl = resolvedUrl.replace(regex, v.value);
          }
        }
      }

      const reqToExecute = { ...request, url: resolvedUrl };
      const resp = await executeHttpRequest(reqToExecute);

      // Add to history
      const newHistoryItem: HistoryEntry = {
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
        request: reqToExecute,
        response: resp,
        executed_at: new Date().toISOString(),
      };

      const updatedHistory = [newHistoryItem, ...history.slice(0, 99)];

      set({
        response: resp,
        isLoading: false,
        history: updatedHistory,
      });

      // Persist workspace
      saveWorkspaceData({
        collections,
        environments,
        history: updatedHistory,
      }).catch(console.error);
    } catch (err: any) {
      set({
        isLoading: false,
        error: err?.message || String(err),
      });
    }
  },

  saveCurrentRequest: async (name: string, collectionId: string) => {
    const { request, collections, environments, history } = get();
    const now = new Date().toISOString();
    const id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());

    const newSaved: SavedRequest = {
      id,
      name,
      request: { ...request },
      created_at: now,
      updated_at: now,
    };

    const updatedCols = collections.map((col) => {
      if (col.id === collectionId) {
        return {
          ...col,
          requests: [...col.requests, newSaved],
          updated_at: now,
        };
      }
      return col;
    });

    set({
      collections: updatedCols,
      activeRequestId: id,
      activeRequestName: name,
    });

    await saveWorkspaceData({
      collections: updatedCols,
      environments,
      history,
    });
  },

  loadSavedRequest: (saved: SavedRequest) => {
    set({
      activeRequestId: saved.id,
      activeRequestName: saved.name,
      request: { ...saved.request },
      response: null,
      error: null,
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

  importCurl: async (curlStr: string) => {
    try {
      const parsed = await parseCurlCommand(curlStr);
      set({
        request: parsed,
        activeRequestId: null,
        activeRequestName: "Imported cURL",
        response: null,
        error: null,
      });
    } catch (err: any) {
      alert(`cURL import failed: ${err}`);
    }
  },

  exportCurl: async () => {
    const { request } = get();
    return await generateCurlCommand(request);
  },
}));
