use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::time::Instant;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KeyValue {
    pub key: String,
    pub value: String,
    #[serde(default = "default_true")]
    pub enabled: bool,
}

fn default_true() -> bool {
    true
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "data")]
pub enum AuthConfig {
    None,
    Bearer {
        token: String,
    },
    Basic {
        username: String,
        password: String,
    },
    ApiKey {
        key: String,
        value: String,
        add_to: String, // "header" or "query"
    },
}

impl Default for AuthConfig {
    fn default() -> Self {
        AuthConfig::None
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HttpRequestPayload {
    pub method: String,
    pub url: String,
    #[serde(default)]
    pub headers: Vec<KeyValue>,
    #[serde(default)]
    pub query_params: Vec<KeyValue>,
    #[serde(default = "default_body_type")]
    pub body_type: String, // "none", "json", "raw", "x-www-form-urlencoded"
    pub body: Option<String>,
    #[serde(default)]
    pub auth: AuthConfig,
    pub timeout_ms: Option<u64>,
}

fn default_body_type() -> String {
    "none".to_string()
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimingMetrics {
    pub total_ms: f64,
    pub ttfb_ms: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HttpResponsePayload {
    pub status: u16,
    pub status_text: String,
    pub headers: Vec<KeyValue>,
    pub body: String,
    pub size_bytes: usize,
    pub is_json: bool,
    pub metrics: TimingMetrics,
}

pub async fn execute_request(req: HttpRequestPayload) -> Result<HttpResponsePayload, String> {
    let client_builder = reqwest::Client::builder()
        .redirect(reqwest::redirect::Policy::limited(10))
        .timeout(std::time::Duration::from_millis(
            req.timeout_ms.unwrap_or(30_000),
        ));

    let client = client_builder
        .build()
        .map_err(|e| format!("Failed to initialize HTTP client: {}", e))?;

    // Parse base URL and append query parameters
    let mut parsed_url = url::Url::parse(&req.url).map_err(|e| format!("Invalid URL: {}", e))?;

    {
        let mut query_pairs = parsed_url.query_pairs_mut();
        for param in &req.query_params {
            if param.enabled && !param.key.trim().is_empty() {
                query_pairs.append_pair(&param.key, &param.value);
            }
        }

        // Handle ApiKey auth when added to query
        if let AuthConfig::ApiKey {
            key,
            value,
            ref add_to,
        } = req.auth
        {
            if add_to == "query" && !key.trim().is_empty() {
                query_pairs.append_pair(&key, &value);
            }
        }
    }

    // Determine HTTP Method
    let method = match req.method.to_uppercase().as_str() {
        "GET" => reqwest::Method::GET,
        "POST" => reqwest::Method::POST,
        "PUT" => reqwest::Method::PUT,
        "DELETE" => reqwest::Method::DELETE,
        "PATCH" => reqwest::Method::PATCH,
        "HEAD" => reqwest::Method::HEAD,
        "OPTIONS" => reqwest::Method::OPTIONS,
        other => {
            reqwest::Method::from_bytes(other.as_bytes())
                .map_err(|_| format!("Unsupported HTTP method: {}", other))?
        }
    };

    let mut request_builder = client.request(method, parsed_url);

    // Apply Headers
    let mut has_user_agent = false;
    let mut has_content_type = false;

    for h in &req.headers {
        if h.enabled && !h.key.trim().is_empty() {
            let key_lower = h.key.to_lowercase();
            if key_lower == "user-agent" {
                has_user_agent = true;
            }
            if key_lower == "content-type" {
                has_content_type = true;
            }
            request_builder = request_builder.header(&h.key, &h.value);
        }
    }

    if !has_user_agent {
        request_builder = request_builder.header("User-Agent", "Reqcraft/0.1.0");
    }

    // Apply Authentication
    match req.auth {
        AuthConfig::Bearer { token } => {
            if !token.trim().is_empty() {
                request_builder = request_builder.bearer_auth(token);
            }
        }
        AuthConfig::Basic { username, password } => {
            request_builder = request_builder.basic_auth(username, Some(password));
        }
        AuthConfig::ApiKey {
            key,
            value,
            add_to,
        } => {
            if add_to == "header" && !key.trim().is_empty() {
                request_builder = request_builder.header(key, value);
            }
        }
        AuthConfig::None => {}
    }

    // Apply Body
    match req.body_type.as_str() {
        "json" => {
            if let Some(body_str) = req.body {
                if !body_str.trim().is_empty() {
                    if !has_content_type {
                        request_builder = request_builder.header("Content-Type", "application/json");
                    }
                    request_builder = request_builder.body(body_str);
                }
            }
        }
        "raw" => {
            if let Some(body_str) = req.body {
                request_builder = request_builder.body(body_str);
            }
        }
        "x-www-form-urlencoded" => {
            if let Some(body_str) = req.body {
                if !has_content_type {
                    request_builder = request_builder.header(
                        "Content-Type",
                        "application/x-www-form-urlencoded",
                    );
                }
                request_builder = request_builder.body(body_str);
            }
        }
        _ => {}
    }

    // Measure timing
    let start_instant = Instant::now();
    let response = request_builder
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    let ttfb_ms = start_instant.elapsed().as_secs_f64() * 1000.0;

    let status = response.status().as_u16();
    let status_text = response
        .status()
        .canonical_reason()
        .unwrap_or("Unknown")
        .to_string();

    let mut response_headers = Vec::new();
    let mut is_json = false;

    for (k, v) in response.headers() {
        let val = v.to_str().unwrap_or("").to_string();
        if k.as_str().eq_ignore_ascii_case("content-type") && val.contains("application/json") {
            is_json = true;
        }
        response_headers.push(KeyValue {
            key: k.as_str().to_string(),
            value: val,
            enabled: true,
        });
    }

    // Fetch response body
    let body_bytes = response
        .bytes()
        .await
        .map_err(|e| format!("Failed to read response body: {}", e))?;

    let total_ms = start_instant.elapsed().as_secs_f64() * 1000.0;
    let size_bytes = body_bytes.len();
    let body_string = String::from_utf8_lossy(&body_bytes).to_string();

    // Auto-detect JSON if header was not explicit
    if !is_json && (body_string.trim().starts_with('{') || body_string.trim().starts_with('[')) {
        if serde_json::from_str::<serde_json::Value>(&body_string).is_ok() {
            is_json = true;
        }
    }

    Ok(HttpResponsePayload {
        status,
        status_text,
        headers: response_headers,
        body: body_string,
        size_bytes,
        is_json,
        metrics: TimingMetrics {
            total_ms: (total_ms * 100.0).round() / 100.0,
            ttfb_ms: (ttfb_ms * 100.0).round() / 100.0,
        },
    })
}
