pub mod curl;
pub mod http;
pub mod storage;

use curl::{generate_curl, parse_curl};
use http::{execute_request, HttpRequestPayload, HttpResponsePayload};
use storage::{
    export_postman_collection as export_postman, load_workspace, parse_postman_collection,
    save_workspace, Collection, WorkspaceData,
};

#[tauri::command]
async fn execute_http_request(request: HttpRequestPayload) -> Result<HttpResponsePayload, String> {
    execute_request(request).await
}

#[tauri::command]
fn parse_curl_command(curl: String) -> Result<HttpRequestPayload, String> {
    parse_curl(&curl)
}

#[tauri::command]
fn generate_curl_command(request: HttpRequestPayload) -> Result<String, String> {
    Ok(generate_curl(&request))
}

#[tauri::command]
fn load_workspace_data() -> Result<WorkspaceData, String> {
    load_workspace()
}

#[tauri::command]
fn save_workspace_data(data: WorkspaceData) -> Result<(), String> {
    save_workspace(&data)
}

#[tauri::command]
fn import_postman_collection(content: String) -> Result<Collection, String> {
    parse_postman_collection(&content)
}

#[tauri::command]
fn export_postman_collection(collection: Collection) -> Result<String, String> {
    export_postman(&collection)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            execute_http_request,
            parse_curl_command,
            generate_curl_command,
            load_workspace_data,
            save_workspace_data,
            import_postman_collection,
            export_postman_collection
        ])
        .run(tauri::generate_context!())
        .expect("error while running Reqcraft application");
}
