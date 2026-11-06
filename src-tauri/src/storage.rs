use crate::http::{AuthConfig, HttpRequestPayload, HttpResponsePayload, KeyValue};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SavedRequest {
    pub id: String,
    pub name: String,
    pub request: HttpRequestPayload,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Collection {
    pub id: String,
    pub name: String,
    #[serde(default)]
    pub description: String,
    #[serde(default)]
    pub requests: Vec<SavedRequest>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Environment {
    pub id: String,
    pub name: String,
    #[serde(default)]
    pub variables: Vec<KeyValue>,
    #[serde(default)]
    pub is_active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HistoryEntry {
    pub id: String,
    pub request: HttpRequestPayload,
    pub response: Option<HttpResponsePayload>,
    pub executed_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct WorkspaceData {
    pub collections: Vec<Collection>,
    pub environments: Vec<Environment>,
    pub history: Vec<HistoryEntry>,
}

fn get_storage_dir() -> PathBuf {
    // Prefer user home ~/.reqcraft, fallback to ./.reqcraft
    if let Some(home) = dirs_next().or_else(std::env::var_os("HOME").map(PathBuf::from)) {
        home.join(".reqcraft")
    } else {
        PathBuf::from(".reqcraft")
    }
}

fn dirs_next() -> Option<PathBuf> {
    std::env::var_os("HOME").map(|h| PathBuf::from(h))
}

pub fn load_workspace() -> Result<WorkspaceData, String> {
    let dir = get_storage_dir();
    let file_path = dir.join("workspace.json");

    if !file_path.exists() {
        // Return default starter workspace
        return Ok(get_starter_workspace());
    }

    let content =
        fs::read_to_string(&file_path).map_err(|e| format!("Failed to read workspace: {}", e))?;

    let data: WorkspaceData = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse workspace JSON: {}", e))?;

    Ok(data)
}

pub fn save_workspace(data: &WorkspaceData) -> Result<(), String> {
    let dir = get_storage_dir();
    if !dir.exists() {
        fs::create_dir_all(&dir)
            .map_err(|e| format!("Failed to create storage directory: {}", e))?;
    }

    let file_path = dir.join("workspace.json");
    let content = serde_json::to_string_pretty(data)
        .map_err(|e| format!("Failed to serialize workspace: {}", e))?;

    fs::write(&file_path, content).map_err(|e| format!("Failed to write workspace: {}", e))?;

    Ok(())
}

fn get_starter_workspace() -> WorkspaceData {
    let now = chrono::Utc::now().to_rfc3339();

    let echo_get = SavedRequest {
        id: uuid::Uuid::new_v4().to_string(),
        name: "Get JSON Echo".to_string(),
        request: HttpRequestPayload {
            method: "GET".to_string(),
            url: "https://httpbin.org/get".to_string(),
            headers: vec![KeyValue {
                key: "Accept".to_string(),
                value: "application/json".to_string(),
                enabled: true,
            }],
            query_params: vec![KeyValue {
                key: "source".to_string(),
                value: "reqcraft".to_string(),
                enabled: true,
            }],
            body_type: "none".to_string(),
            body: None,
            auth: AuthConfig::None,
            timeout_ms: Some(30_000),
        },
        created_at: now.clone(),
        updated_at: now.clone(),
    };

    let echo_post = SavedRequest {
        id: uuid::Uuid::new_v4().to_string(),
        name: "Post JSON Payload".to_string(),
        request: HttpRequestPayload {
            method: "POST".to_string(),
            url: "https://httpbin.org/post".to_string(),
            headers: vec![KeyValue {
                key: "Content-Type".to_string(),
                value: "application/json".to_string(),
                enabled: true,
            }],
            query_params: vec![],
            body_type: "json".to_string(),
            body: Some(
                r#"{
  "project": "Reqcraft",
  "engine": "Rust + Tauri",
  "status": "blazing fast"
}"#
                .to_string(),
            ),
            auth: AuthConfig::None,
            timeout_ms: Some(30_000),
        },
        created_at: now.clone(),
        updated_at: now.clone(),
    };

    let default_collection = Collection {
        id: uuid::Uuid::new_v4().to_string(),
        name: "Starter Examples".to_string(),
        description: "Standard HTTP echo requests to verify Reqcraft functionality".to_string(),
        requests: vec![echo_get, echo_post],
        created_at: now.clone(),
        updated_at: now.clone(),
    };

    let default_env = Environment {
        id: uuid::Uuid::new_v4().to_string(),
        name: "Development".to_string(),
        variables: vec![
            KeyValue {
                key: "baseUrl".to_string(),
                value: "https://httpbin.org".to_string(),
                enabled: true,
            },
            KeyValue {
                key: "apiKey".to_string(),
                value: "req_demo_secret_token".to_string(),
                enabled: true,
            },
        ],
        is_active: true,
    };

    WorkspaceData {
        collections: vec![default_collection],
        environments: vec![default_env],
        history: vec![],
    }
}

// Postman v2.1 Importer
#[derive(Debug, Deserialize)]
struct PostmanCollection {
    info: Option<PostmanInfo>,
    item: Option<Vec<PostmanItem>>,
}

#[derive(Debug, Deserialize)]
struct PostmanInfo {
    name: Option<String>,
    description: Option<String>,
}

#[derive(Debug, Deserialize)]
struct PostmanItem {
    name: Option<String>,
    request: Option<PostmanRequest>,
    item: Option<Vec<PostmanItem>>,
}

#[derive(Debug, Deserialize)]
struct PostmanRequest {
    method: Option<String>,
    url: Option<serde_json::Value>,
    header: Option<Vec<PostmanHeader>>,
    body: Option<PostmanBody>,
    auth: Option<PostmanAuth>,
}

#[derive(Debug, Deserialize)]
struct PostmanHeader {
    key: Option<String>,
    value: Option<String>,
    disabled: Option<bool>,
}

#[derive(Debug, Deserialize)]
struct PostmanBody {
    mode: Option<String>,
    raw: Option<String>,
}

#[derive(Debug, Deserialize)]
struct PostmanAuth {
    r#type: Option<String>,
    bearer: Option<Vec<PostmanAuthParam>>,
}

#[derive(Debug, Deserialize)]
struct PostmanAuthParam {
    key: Option<String>,
    value: Option<String>,
}

pub fn parse_postman_collection(json_str: &str) -> Result<Collection, String> {
    let parsed: PostmanCollection = serde_json::from_str(json_str)
        .map_err(|e| format!("Invalid Postman collection format: {}", e))?;

    let now = chrono::Utc::now().to_rfc3339();
    let col_name = parsed
        .info
        .as_ref()
        .and_then(|i| i.name.clone())
        .unwrap_or_else(|| "Imported Postman Collection".to_string());
    let description = parsed
        .info
        .as_ref()
        .and_then(|i| i.description.clone())
        .unwrap_or_default();

    let mut saved_requests = Vec::new();
    if let Some(items) = parsed.item {
        flatten_postman_items(&items, &mut saved_requests, &now);
    }

    Ok(Collection {
        id: uuid::Uuid::new_v4().to_string(),
        name: col_name,
        description,
        requests: saved_requests,
        created_at: now.clone(),
        updated_at: now,
    })
}

fn flatten_postman_items(
    items: &[PostmanItem],
    out: &mut Vec<SavedRequest>,
    timestamp: &str,
) {
    for item in items {
        if let Some(req) = &item.request {
            let req_name = item.name.clone().unwrap_or_else(|| "Request".to_string());
            let method = req.method.clone().unwrap_or_else(|| "GET".to_string());

            let mut url_str = String::new();
            let mut query_params = Vec::new();

            if let Some(url_val) = &req.url {
                if let Some(raw) = url_val.as_str() {
                    url_str = raw.to_string();
                } else if let Some(obj) = url_val.as_object() {
                    if let Some(raw) = obj.get("raw").and_then(|r| r.as_str()) {
                        url_str = raw.to_string();
                    }
                    if let Some(query_arr) = obj.get("query").and_then(|q| q.as_array()) {
                        for q in query_arr {
                            if let (Some(k), Some(v)) = (
                                q.get("key").and_then(|k| k.as_str()),
                                q.get("value").and_then(|v| v.as_str()),
                            ) {
                                let disabled = q.get("disabled").and_then(|d| d.as_bool()).unwrap_or(false);
                                query_params.push(KeyValue {
                                    key: k.to_string(),
                                    value: v.to_string(),
                                    enabled: !disabled,
                                });
                            }
                        }
                    }
                }
            }

            let mut headers = Vec::new();
            if let Some(hdr_list) = &req.header {
                for h in hdr_list {
                    if let (Some(k), Some(v)) = (&h.key, &h.value) {
                        headers.push(KeyValue {
                            key: k.clone(),
                            value: v.clone(),
                            enabled: !h.disabled.unwrap_or(false),
                        });
                    }
                }
            }

            let (body_type, body) = if let Some(b) = &req.body {
                let mode = b.mode.as_deref().unwrap_or("none");
                let raw = b.raw.clone();
                match mode {
                    "raw" => {
                        let is_json = raw.as_ref().map_or(false, |r| {
                            r.trim().starts_with('{') || r.trim().starts_with('[')
                        });
                        if is_json {
                            ("json".to_string(), raw)
                        } else {
                            ("raw".to_string(), raw)
                        }
                    }
                    "urlencoded" => ("x-www-form-urlencoded".to_string(), raw),
                    _ => ("none".to_string(), None),
                }
            } else {
                ("none".to_string(), None)
            };

            let mut auth = AuthConfig::None;
            if let Some(a) = &req.auth {
                if let Some(t) = &a.r#type {
                    if t == "bearer" {
                        if let Some(bearer_params) = &a.bearer {
                            for p in bearer_params {
                                if p.key.as_deref() == Some("token") {
                                    if let Some(val) = &p.value {
                                        auth = AuthConfig::Bearer {
                                            token: val.clone(),
                                        };
                                    }
                                }
                            }
                        }
                    }
                }
            }

            out.push(SavedRequest {
                id: uuid::Uuid::new_v4().to_string(),
                name: req_name,
                request: HttpRequestPayload {
                    method,
                    url: url_str,
                    headers,
                    query_params,
                    body_type,
                    body,
                    auth,
                    timeout_ms: Some(30_000),
                },
                created_at: timestamp.to_string(),
                updated_at: timestamp.to_string(),
            });
        }

        // Handle nested folders
        if let Some(sub_items) = &item.item {
            flatten_postman_items(sub_items, out, timestamp);
        }
    }
}
