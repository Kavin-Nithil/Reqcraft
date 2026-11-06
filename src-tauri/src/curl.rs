use crate::http::{AuthConfig, HttpRequestPayload, KeyValue};

pub fn parse_curl(curl_cmd: &str) -> Result<HttpRequestPayload, String> {
    let raw = curl_cmd.trim();
    if !raw.starts_with("curl") {
        return Err("Input does not start with 'curl'".to_string());
    }

    // Tokenize command line taking quotes into account
    let tokens = tokenize_args(raw)?;

    let mut method = "GET".to_string();
    let mut url = "".to_string();
    let mut headers = Vec::new();
    let mut body = None;
    let mut body_type = "none".to_string();
    let mut auth = AuthConfig::None;

    let mut i = 1; // skip "curl"
    while i < tokens.len() {
        let token = &tokens[i];

        match token.as_str() {
            "-X" | "--request" => {
                if i + 1 < tokens.len() {
                    method = tokens[i + 1].to_uppercase();
                    i += 1;
                }
            }
            "-H" | "--header" => {
                if i + 1 < tokens.len() {
                    let header_str = &tokens[i + 1];
                    if let Some((k, v)) = header_str.split_once(':') {
                        headers.push(KeyValue {
                            key: k.trim().to_string(),
                            value: v.trim().to_string(),
                            enabled: true,
                        });
                    }
                    i += 1;
                }
            }
            "-d" | "--data" | "--data-raw" | "--data-binary" => {
                if i + 1 < tokens.len() {
                    body = Some(tokens[i + 1].clone());
                    body_type = if tokens[i + 1].trim().starts_with('{')
                        || tokens[i + 1].trim().starts_with('[')
                    {
                        "json".to_string()
                    } else {
                        "raw".to_string()
                    };
                    if method == "GET" {
                        method = "POST".to_string();
                    }
                    i += 1;
                }
            }
            "-u" | "--user" => {
                if i + 1 < tokens.len() {
                    let creds = &tokens[i + 1];
                    let (user, pass) = match creds.split_once(':') {
                        Some((u, p)) => (u.to_string(), p.to_string()),
                        None => (creds.to_string(), "".to_string()),
                    };
                    auth = AuthConfig::Basic {
                        username: user,
                        password: pass,
                    };
                    i += 1;
                }
            }
            _ => {
                // If token doesn't start with dash, treat as URL
                if !token.starts_with('-') && url.is_empty() {
                    url = token.clone();
                }
            }
        }
        i += 1;
    }

    if url.is_empty() {
        return Err("No URL found in cURL command".to_string());
    }

    // Extract query params from URL if present
    let mut query_params = Vec::new();
    if let Ok(parsed) = url::Url::parse(&url) {
        for (k, v) in parsed.query_pairs() {
            query_params.push(KeyValue {
                key: k.to_string(),
                value: v.to_string(),
                enabled: true,
            });
        }
    }

    Ok(HttpRequestPayload {
        method,
        url,
        headers,
        query_params,
        body_type,
        body,
        auth,
        timeout_ms: Some(30_000),
    })
}

pub fn generate_curl(req: &HttpRequestPayload) -> String {
    let mut parts = vec!["curl".to_string()];

    // Method
    let method = req.method.to_uppercase();
    if method != "GET" {
        parts.push(format!("-X {}", method));
    }

    // Headers
    for h in &req.headers {
        if h.enabled && !h.key.trim().is_empty() {
            parts.push(format!("-H '{}: {}'", h.key, h.value.replace('\'', "'\\''")));
        }
    }

    // Auth
    match &req.auth {
        AuthConfig::Bearer { token } => {
            if !token.trim().is_empty() {
                parts.push(format!("-H 'Authorization: Bearer {}'", token));
            }
        }
        AuthConfig::Basic { username, password } => {
            parts.push(format!("-u '{}:{}'", username, password));
        }
        AuthConfig::ApiKey {
            key,
            value,
            add_to,
        } => {
            if add_to == "header" && !key.trim().is_empty() {
                parts.push(format!("-H '{}: {}'", key, value));
            }
        }
        AuthConfig::None => {}
    }

    // Body
    if let Some(body) = &req.body {
        if !body.trim().is_empty() && req.body_type != "none" {
            parts.push(format!("-d '{}'", body.replace('\'', "'\\''")));
        }
    }

    // URL
    parts.push(format!("'{}'", req.url.replace('\'', "'\\''")));

    parts.join(" ")
}

fn tokenize_args(cmd: &str) -> Result<Vec<String>, String> {
    let mut tokens = Vec::new();
    let mut current = String::new();
    let mut in_single_quote = false;
    let mut in_double_quote = false;
    let mut escaped = false;

    for ch in cmd.chars() {
        if escaped {
            current.push(ch);
            escaped = false;
            continue;
        }

        match ch {
            '\\' => {
                escaped = true;
            }
            '\'' if !in_double_quote => {
                in_single_quote = !in_single_quote;
            }
            '"' if !in_single_quote => {
                in_double_quote = !in_double_quote;
            }
            ' ' | '\t' | '\n' | '\r' if !in_single_quote && !in_double_quote => {
                if !current.is_empty() {
                    tokens.push(current);
                    current = String::new();
                }
            }
            _ => {
                current.push(ch);
            }
        }
    }

    if !current.is_empty() {
        tokens.push(current);
    }

    Ok(tokens)
}
