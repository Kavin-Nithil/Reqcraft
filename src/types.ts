export interface KeyValue {
  key: string;
  value: string;
  enabled: boolean;
}

export type AuthType = "none" | "bearer" | "basic" | "api_key";

export interface AuthConfig {
  type: "None" | "Bearer" | "Basic" | "ApiKey";
  data?: {
    token?: string;
    username?: string;
    password?: string;
    key?: string;
    value?: string;
    add_to?: "header" | "query";
  };
}

export type BodyType = "none" | "json" | "raw" | "x-www-form-urlencoded";

export interface HttpRequest {
  method: string;
  url: string;
  headers: KeyValue[];
  query_params: KeyValue[];
  body_type: BodyType;
  body?: string;
  auth: AuthConfig;
  timeout_ms?: number;
}

export interface TimingMetrics {
  total_ms: number;
  ttfb_ms: number;
}

export interface HttpResponse {
  status: number;
  status_text: string;
  headers: KeyValue[];
  body: string;
  size_bytes: number;
  is_json: boolean;
  metrics: TimingMetrics;
}

export interface SavedRequest {
  id: string;
  name: string;
  request: HttpRequest;
  created_at: string;
  updated_at: string;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  requests: SavedRequest[];
  created_at: string;
  updated_at: string;
}

export interface Environment {
  id: string;
  name: string;
  variables: KeyValue[];
  is_active: boolean;
}

export interface HistoryEntry {
  id: string;
  request: HttpRequest;
  response?: HttpResponse;
  executed_at: string;
}

export interface WorkspaceData {
  collections: Collection[];
  environments: Environment[];
  history: HistoryEntry[];
}
