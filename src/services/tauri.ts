import { invoke } from "@tauri-apps/api/core";
import {
  HttpRequest,
  HttpResponse,
  Collection,
  WorkspaceData,
  SavedRequest,
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
  const urlObj = new URL(req.url);

  // Append query params
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

  // Simple client-side fallback curl parser
  const matchUrl = curl.match(/(?:curl\s+)?(?:-X\s+[A-Z]+\s+)?['"]?(https?:\/\/[^\s'"]+)/i);
  const matchMethod = curl.match(/-X\s+([A-Z]+)/i);
  const headers: Array<{ key: string; value: string; enabled: boolean }> = [];

  const headerMatches = curl.matchAll(/-H\s+['"]([^'"]+)['"]/g);
  for (const m of headerMatches) {
    const [k, v] = m[1].split(/:\s*/);
    if (k && v) headers.push({ key: k, value: v, enabled: true });
  }

  const bodyMatch = curl.match(/(?:-d|--data|--data-raw)\s+['"]([\s\S]*?)['"](?:\s|$)/);

  return {
    method: matchMethod ? matchMethod[1].toUpperCase() : bodyMatch ? "POST" : "GET",
    url: matchUrl ? matchUrl[1] : "https://httpbin.org/get",
    headers,
    query_params: [],
    body_type: bodyMatch ? "json" : "none",
    body: bodyMatch ? bodyMatch[1] : undefined,
    auth: { type: "None" },
  };
}

export async function generateCurlCommand(request: HttpRequest): Promise<string> {
  if (isTauri()) {
    return await invoke<string>("generate_curl_command", { request });
  }
  return `curl -X ${request.method} '${request.url}'`;
}

export async function loadWorkspaceData(): Promise<WorkspaceData> {
  if (isTauri()) {
    return await invoke<WorkspaceData>("load_workspace_data");
  }

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
          {
            id: "req-2",
            name: "Create User Payload",
            request: {
              method: "POST",
              url: "https://httpbin.org/post",
              headers: [{ key: "Content-Type", value: "application/json", enabled: true }],
              query_params: [],
              body_type: "json",
              body: JSON.stringify({ name: "Kavin Nithil", role: "Software Engineer", app: "Reqcraft" }, null, 2),
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

// Import Postman v2.1 Collection
export async function importPostmanCollection(content: string): Promise<Collection> {
  if (isTauri()) {
    return await invoke<Collection>("import_postman_collection", { content });
  }

  // Pure TypeScript Postman v2.1 parser for web fallback
  const parsed = JSON.parse(content);
  const now = new Date().toISOString();
  const requests: SavedRequest[] = [];

  const extractItems = (items: any[]) => {
    for (const item of items) {
      if (item.request) {
        let urlStr = "";
        const queryParams: Array<{ key: string; value: string; enabled: boolean }> = [];
        if (typeof item.request.url === "string") {
          urlStr = item.request.url;
        } else if (item.request.url?.raw) {
          urlStr = item.request.url.raw;
          if (Array.isArray(item.request.url.query)) {
            item.request.url.query.forEach((q: any) => {
              queryParams.push({
                key: q.key || "",
                value: q.value || "",
                enabled: !q.disabled,
              });
            });
          }
        }

        const headers: Array<{ key: string; value: string; enabled: boolean }> = [];
        if (Array.isArray(item.request.header)) {
          item.request.header.forEach((h: any) => {
            headers.push({
              key: h.key || "",
              value: h.value || "",
              enabled: !h.disabled,
            });
          });
        }

        const bodyRaw = item.request.body?.raw || undefined;
        const bodyType = item.request.body?.mode === "raw" ? "json" : "none";

        requests.push({
          id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
          name: item.name || "Imported Request",
          request: {
            method: (item.request.method || "GET").toUpperCase(),
            url: urlStr,
            headers,
            query_params: queryParams,
            body_type: bodyType as any,
            body: bodyRaw,
            auth: { type: "None" },
          },
          created_at: now,
          updated_at: now,
        });
      }
      if (Array.isArray(item.item)) {
        extractItems(item.item);
      }
    }
  };

  if (Array.isArray(parsed.item)) {
    extractItems(parsed.item);
  }

  return {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    name: parsed.info?.name || "Imported Postman Collection",
    description: parsed.info?.description || "",
    requests,
    created_at: now,
    updated_at: now,
  };
}

// Export Postman v2.1 Collection JSON
export async function exportPostmanCollection(col: Collection): Promise<string> {
  if (isTauri()) {
    try {
      return await invoke<string>("export_postman_collection", { collection: col });
    } catch {
      // fallback to JS serializer
    }
  }

  // Pure TypeScript Postman v2.1 exporter
  const postmanItems = col.requests.map((r) => {
    let urlObj: URL | null = null;
    try {
      urlObj = new URL(r.request.url);
    } catch {
      // not a valid absolute URL
    }

    return {
      name: r.name,
      request: {
        method: r.request.method,
        header: r.request.headers.map((h) => ({
          key: h.key,
          value: h.value,
          type: "text",
          disabled: !h.enabled,
        })),
        url: {
          raw: r.request.url,
          protocol: urlObj ? urlObj.protocol.replace(":", "") : undefined,
          host: urlObj ? urlObj.hostname.split(".") : undefined,
          path: urlObj ? urlObj.pathname.split("/").filter(Boolean) : undefined,
          query: r.request.query_params.map((q) => ({
            key: q.key,
            value: q.value,
            disabled: !q.enabled,
          })),
        },
        body:
          r.request.body_type !== "none" && r.request.body
            ? {
                mode: "raw",
                raw: r.request.body,
                options: {
                  raw: {
                    language: r.request.body_type === "json" ? "json" : "text",
                  },
                },
              }
            : undefined,
        auth:
          r.request.auth.type === "Bearer" && r.request.auth.data?.token
            ? {
                type: "bearer",
                bearer: [{ key: "token", value: r.request.auth.data.token, type: "string" }],
              }
            : undefined,
      },
      response: [],
    };
  });

  const postmanCollection = {
    info: {
      _postman_id: col.id,
      name: col.name,
      description: col.description || "Exported from Reqcraft",
      schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    },
    item: postmanItems,
  };

  return JSON.stringify(postmanCollection, null, 2);
}

// Download JSON file in browser or desktop
export function downloadJsonFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".json") ? filename : `${filename}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
