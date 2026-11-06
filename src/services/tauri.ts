import { invoke } from "@tauri-apps/api/core";
import {
  HttpRequest,
  HttpResponse,
  Collection,
  WorkspaceData,
} from "../types";

// Check if running in Tauri desktop environment
export const isTauri = (): boolean => {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
};

export async function executeHttpRequest(req: HttpRequest): Promise<HttpResponse> {
  if (isTauri()) {
    return await invoke<HttpResponse>("execute_http_request", { request: req });
  }

  // Graceful browser fallback for standalone web testing
  const start = performance.now();
  let url = req.url;

  // Append query params
  const urlObj = new URL(url);
  req.query_params.forEach((param) => {
    if (param.enabled && param.key.trim()) {
      urlObj.searchParams.append(param.key, param.value);
    }
  });

  const headers: Record<string, string> = {};
  req.headers.forEach((h) => {
    if (h.enabled && h.key.trim()) {
      headers[h.key] = h.value;
    }
  });

  if (req.auth.type === "Bearer" && req.auth.data?.token) {
    headers["Authorization"] = `Bearer ${req.auth.data.token}`;
  }

  const res = await fetch(urlObj.toString(), {
    method: req.method,
    headers,
    body:
      req.method !== "GET" && req.method !== "HEAD" && req.body_type !== "none"
        ? req.body
        : undefined,
  });

  const total = performance.now() - start;
  const text = await res.text();
  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json") || text.trim().startsWith("{");

  const responseHeaders = Array.from(res.headers.entries()).map(([key, value]) => ({
    key,
    value,
    enabled: true,
  }));

  return {
    status: res.status,
    status_text: res.statusText || "OK",
    headers: responseHeaders,
    body: text,
    size_bytes: new Blob([text]).size,
    is_json: isJson,
    metrics: {
      total_ms: Math.round(total * 100) / 100,
      ttfb_ms: Math.round(total * 0.4 * 100) / 100,
    },
  };
}

export async function parseCurlCommand(curl: string): Promise<HttpRequest> {
  if (isTauri()) {
    return await invoke<HttpRequest>("parse_curl_command", { curl });
  }
  throw new Error("cURL parsing requires native desktop runtime");
}

export async function generateCurlCommand(request: HttpRequest): Promise<string> {
  if (isTauri()) {
    return await invoke<string>("generate_curl_command", { request });
  }
  // Simple fallback cURL generator
  return `curl -X ${request.method} '${request.url}'`;
}

export async function loadWorkspaceData(): Promise<WorkspaceData> {
  if (isTauri()) {
    return await invoke<WorkspaceData>("load_workspace_data");
  }

  // Local storage fallback for browser preview
  const saved = localStorage.getItem("reqcraft_workspace");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // ignore
    }
  }

  return {
    collections: [
      {
        id: "default-col-1",
        name: "Starter Examples",
        description: "Standard HTTP echo requests",
        requests: [
          {
            id: "req-1",
            name: "Get JSON Echo",
            request: {
              method: "GET",
              url: "https://httpbin.org/get",
              headers: [{ key: "Accept", value: "application/json", enabled: true }],
              query_params: [{ key: "source", value: "reqcraft", enabled: true }],
              body_type: "none",
              auth: { type: "None" },
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    environments: [
      {
        id: "env-1",
        name: "Development",
        variables: [
          { key: "baseUrl", value: "https://httpbin.org", enabled: true },
          { key: "apiKey", value: "reqcraft_demo_token", enabled: true },
        ],
        is_active: true,
      },
    ],
    history: [],
  };
}

export async function saveWorkspaceData(data: WorkspaceData): Promise<void> {
  if (isTauri()) {
    return await invoke<void>("save_workspace_data", { data });
  }
  localStorage.setItem("reqcraft_workspace", JSON.stringify(data));
}

export async function importPostmanCollection(content: string): Promise<Collection> {
  if (isTauri()) {
    return await invoke<Collection>("import_postman_collection", { content });
  }
  throw new Error("Postman import requires native desktop runtime");
}
