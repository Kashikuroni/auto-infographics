use font_kit::source::SystemSource;
use std::fs;
use std::path::Path;

const TEMPLATES_DIR: &str = ".infographics-templates";

#[derive(serde::Serialize)]
struct ImageFileInfo {
    path: String,
    name: String,
}

#[derive(serde::Serialize, serde::Deserialize)]
struct TemplateInfo {
    name: String,
    path: String,
    created_at: String,
}

#[tauri::command]
fn list_images_in_directory(directory: String) -> Result<Vec<ImageFileInfo>, String> {
    let path = Path::new(&directory);

    if !path.is_dir() {
        return Err("Not a valid directory".to_string());
    }

    let image_extensions = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"];

    let mut images: Vec<ImageFileInfo> = Vec::new();

    match fs::read_dir(path) {
        Ok(entries) => {
            for entry in entries.flatten() {
                let file_path = entry.path();
                if file_path.is_file() {
                    if let Some(ext) = file_path.extension() {
                        let ext_lower = ext.to_string_lossy().to_lowercase();
                        if image_extensions.contains(&ext_lower.as_str()) {
                            images.push(ImageFileInfo {
                                path: file_path.to_string_lossy().to_string(),
                                name: file_path
                                    .file_name()
                                    .map(|n| n.to_string_lossy().to_string())
                                    .unwrap_or_default(),
                            });
                        }
                    }
                }
            }
        }
        Err(e) => return Err(e.to_string()),
    }

    // Sort alphabetically by name
    images.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));

    Ok(images)
}

#[tauri::command]
fn get_system_fonts() -> Vec<String> {
    let source = SystemSource::new();
    match source.all_families() {
        Ok(families) => {
            let mut fonts: Vec<String> = families
                .into_iter()
                .filter(|f| !f.starts_with('.')) // Filter hidden fonts
                .collect();
            fonts.sort();
            fonts.dedup();
            fonts
        }
        Err(_) => vec![
            "Arial".to_string(),
            "Helvetica".to_string(),
            "Times New Roman".to_string(),
            "Georgia".to_string(),
            "Monaco".to_string(),
        ],
    }
}

// Template commands
#[tauri::command]
fn save_template(
    working_directory: String,
    name: String,
    template_data: String,
) -> Result<String, String> {
    let templates_path = Path::new(&working_directory).join(TEMPLATES_DIR);

    // Create templates directory if it doesn't exist
    if !templates_path.exists() {
        fs::create_dir_all(&templates_path).map_err(|e| e.to_string())?;
    }

    // Sanitize filename
    let safe_name = name
        .chars()
        .filter(|c| c.is_alphanumeric() || *c == '-' || *c == '_' || *c == ' ')
        .collect::<String>();

    if safe_name.is_empty() {
        return Err("Invalid template name".to_string());
    }

    let file_path = templates_path.join(format!("{}.json", safe_name));
    fs::write(&file_path, template_data).map_err(|e| e.to_string())?;

    Ok(file_path.to_string_lossy().to_string())
}

#[tauri::command]
fn load_template(template_path: String) -> Result<String, String> {
    let path = Path::new(&template_path);

    if !path.exists() {
        return Err("Template file not found".to_string());
    }

    fs::read_to_string(path).map_err(|e| e.to_string())
}

#[tauri::command]
fn list_templates(working_directory: String) -> Result<Vec<TemplateInfo>, String> {
    let templates_path = Path::new(&working_directory).join(TEMPLATES_DIR);

    if !templates_path.exists() {
        return Ok(Vec::new());
    }

    let mut templates: Vec<TemplateInfo> = Vec::new();

    match fs::read_dir(&templates_path) {
        Ok(entries) => {
            for entry in entries.flatten() {
                let file_path = entry.path();
                if file_path.is_file() {
                    if let Some(ext) = file_path.extension() {
                        if ext == "json" {
                            // Try to parse template to get metadata
                            if let Ok(content) = fs::read_to_string(&file_path) {
                                if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
                                    let name = json.get("name")
                                        .and_then(|v| v.as_str())
                                        .map(|s| s.to_string())
                                        .unwrap_or_else(|| {
                                            file_path.file_stem()
                                                .map(|s| s.to_string_lossy().to_string())
                                                .unwrap_or_else(|| "Unnamed".to_string())
                                        });

                                    let created_at = json.get("createdAt")
                                        .and_then(|v| v.as_str())
                                        .unwrap_or("")
                                        .to_string();

                                    templates.push(TemplateInfo {
                                        name,
                                        path: file_path.to_string_lossy().to_string(),
                                        created_at,
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }
        Err(e) => return Err(e.to_string()),
    }

    // Sort by creation date (newest first)
    templates.sort_by(|a, b| b.created_at.cmp(&a.created_at));

    Ok(templates)
}

#[tauri::command]
fn delete_template(template_path: String) -> Result<(), String> {
    let path = Path::new(&template_path);

    if !path.exists() {
        return Err("Template file not found".to_string());
    }

    fs::remove_file(path).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            get_system_fonts,
            list_images_in_directory,
            save_template,
            load_template,
            list_templates,
            delete_template
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
