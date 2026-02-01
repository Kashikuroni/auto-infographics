use ab_glyph::{Font, FontVec, PxScale, ScaleFont};
use font_kit::source::SystemSource;
use futures::stream::{self, StreamExt};
use image::{DynamicImage, ImageBuffer, Rgba, RgbaImage};
use imageproc::drawing::draw_text_mut;
use imageproc::geometric_transformations::{rotate_about_center, Interpolation};
use serde::Deserialize;
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;
use tauri::{AppHandle, Emitter};

const TEMPLATES_DIR: &str = ".infographics-templates";
const OUTPUT_DIR: &str = "infographics";

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
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

// Structures for infographic generation
#[derive(Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
struct FrameSettings {
    width: u32,
    height: u32,
    background_color: String,
}

#[derive(Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
#[allow(dead_code)] // Some fields reserved for future features (custom fonts, alignment)
struct CanvasObject {
    id: String,
    #[serde(rename = "type")]
    obj_type: String,
    x: f64,
    y: f64,
    width: f64,
    height: f64,
    rotation: f64,
    opacity: f64,
    visible: bool,
    name: String,
    // Text-specific fields
    content: Option<String>,
    key: Option<String>,
    font_family: Option<String>,
    font_size: Option<u32>,
    font_weight: Option<String>,
    fill: Option<String>,
    align: Option<String>,
    // Image-specific fields
    src: Option<String>,
    original_path: Option<String>,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct GenerateRequest {
    working_directory: String,
    frame: FrameSettings,
    objects: Vec<CanvasObject>,
    table_data: HashMap<String, HashMap<String, String>>,
    selected_images: Vec<ImageFileInfo>,
    template_name: Option<String>,  // Output subdirectory (if working with a template)
    parallelism: Option<usize>,     // Number of threads (default: half of CPU cores)
}

#[derive(serde::Serialize)]
struct GenerateResult {
    success: bool,
    generated_files: Vec<String>,
    errors: Vec<String>,
}

#[derive(Clone, serde::Serialize)]
struct GenerationProgress {
    current: usize,
    total: usize,
    current_file: String,
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

#[derive(serde::Serialize)]
struct CpuInfo {
    logical_cores: usize,
    physical_cores: usize,
    recommended: usize,
}

#[tauri::command]
fn get_cpu_info() -> CpuInfo {
    let logical = num_cpus::get();
    let physical = num_cpus::get_physical();
    let recommended = (logical / 2).max(1);

    CpuInfo {
        logical_cores: logical,
        physical_cores: physical,
        recommended,
    }
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

// Helper: Parse hex color to Rgba
fn parse_hex_color(hex: &str) -> Rgba<u8> {
    let hex = hex.trim_start_matches('#');
    if hex.len() >= 6 {
        let r = u8::from_str_radix(&hex[0..2], 16).unwrap_or(255);
        let g = u8::from_str_radix(&hex[2..4], 16).unwrap_or(255);
        let b = u8::from_str_radix(&hex[4..6], 16).unwrap_or(255);
        let a = if hex.len() >= 8 {
            u8::from_str_radix(&hex[6..8], 16).unwrap_or(255)
        } else {
            255
        };
        Rgba([r, g, b, a])
    } else {
        Rgba([255, 255, 255, 255])
    }
}

// Helper: Rotate image around its center with expanded canvas to prevent clipping
fn rotate_image(img: &RgbaImage, angle_degrees: f64) -> RgbaImage {
    if angle_degrees == 0.0 {
        return img.clone();
    }

    let (w, h) = img.dimensions();
    let radians = angle_degrees.to_radians();
    let cos = radians.cos().abs();
    let sin = radians.sin().abs();

    // Calculate expanded dimensions to fit rotated image
    let new_w = (w as f64 * cos + h as f64 * sin).ceil() as u32;
    let new_h = (w as f64 * sin + h as f64 * cos).ceil() as u32;

    // Create expanded buffer
    let mut expanded: RgbaImage = ImageBuffer::from_pixel(new_w, new_h, Rgba([0, 0, 0, 0]));

    // Center the original image in the expanded buffer
    let offset_x = (new_w - w) / 2;
    let offset_y = (new_h - h) / 2;

    for (px, py, pixel) in img.enumerate_pixels() {
        expanded.put_pixel(px + offset_x, py + offset_y, *pixel);
    }

    // Now rotate - the expanded buffer is large enough to contain rotated corners
    rotate_about_center(&expanded, radians as f32, Interpolation::Bilinear, Rgba([0, 0, 0, 0]))
}

// Helper: Overlay image onto canvas with position, size, rotation and opacity
fn overlay_image(
    canvas: &mut RgbaImage,
    source: &DynamicImage,
    x: i64,
    y: i64,
    width: u32,
    height: u32,
    rotation: f64,
    opacity: f64,
) {
    // Resize source image to target dimensions
    let resized = source.resize_exact(width, height, image::imageops::FilterType::Lanczos3);
    let resized_rgba = resized.to_rgba8();

    // Apply rotation if needed and calculate top-left position
    let (final_img, top_left_x, top_left_y) = if rotation != 0.0 {
        let rotated = rotate_image(&resized_rgba, rotation);
        // Center should be at (x + width/2, y + height/2)
        // Position rotated image so its center aligns with target center
        let center_x = x + width as i64 / 2;
        let center_y = y + height as i64 / 2;
        let tlx = center_x - rotated.width() as i64 / 2;
        let tly = center_y - rotated.height() as i64 / 2;
        (rotated, tlx, tly)
    } else {
        (resized_rgba, x, y)
    };

    let (canvas_width, canvas_height) = canvas.dimensions();
    let alpha_mult = (opacity * 255.0) as u8;

    for (px, py, pixel) in final_img.enumerate_pixels() {
        let target_x = top_left_x + px as i64;
        let target_y = top_left_y + py as i64;

        if target_x >= 0
            && target_y >= 0
            && target_x < canvas_width as i64
            && target_y < canvas_height as i64
        {
            let tx = target_x as u32;
            let ty = target_y as u32;

            // Alpha blending
            let src_alpha = ((pixel[3] as u32 * alpha_mult as u32) / 255) as u8;
            if src_alpha > 0 {
                let dst = canvas.get_pixel(tx, ty);
                let inv_alpha = 255 - src_alpha;

                let r = ((pixel[0] as u32 * src_alpha as u32
                    + dst[0] as u32 * inv_alpha as u32)
                    / 255) as u8;
                let g = ((pixel[1] as u32 * src_alpha as u32
                    + dst[1] as u32 * inv_alpha as u32)
                    / 255) as u8;
                let b = ((pixel[2] as u32 * src_alpha as u32
                    + dst[2] as u32 * inv_alpha as u32)
                    / 255) as u8;
                let a = src_alpha.max(dst[3]);

                canvas.put_pixel(tx, ty, Rgba([r, g, b, a]));
            }
        }
    }
}

// Helper: Overlay image with fit mode (preserves aspect ratio, rotation around bounding box center)
fn overlay_image_fit(
    canvas: &mut RgbaImage,
    source: &DynamicImage,
    x: i64,
    y: i64,
    target_width: u32,
    target_height: u32,
    rotation: f64,
    opacity: f64,
) {
    let img_ratio = source.width() as f64 / source.height() as f64;
    let target_ratio = target_width as f64 / target_height as f64;

    let (render_width, render_height) = if img_ratio > target_ratio {
        // Image is wider - fit to width
        (target_width, (target_width as f64 / img_ratio) as u32)
    } else {
        // Image is taller - fit to height
        ((target_height as f64 * img_ratio) as u32, target_height)
    };

    // Resize preserving aspect ratio
    let resized = source.resize(render_width, render_height, image::imageops::FilterType::Lanczos3);
    let resized_rgba = resized.to_rgba8();

    // Calculate final image and position
    let (final_img, top_left_x, top_left_y) = if rotation != 0.0 {
        // Create bounding box sized buffer (matches editor behavior)
        // In editor, rotation happens around bounding box center, not fitted image center
        let mut bbox_buffer: RgbaImage = ImageBuffer::from_pixel(
            target_width, target_height, Rgba([0, 0, 0, 0])
        );

        // Place fitted image at (0, 0) within bounding box (matches editor)
        for (px, py, pixel) in resized_rgba.enumerate_pixels() {
            if px < target_width && py < target_height {
                bbox_buffer.put_pixel(px, py, *pixel);
            }
        }

        // Rotate bounding box around its center
        let rotated = rotate_image(&bbox_buffer, rotation);

        // Position rotated image so center aligns with target center
        let center_x = x + target_width as i64 / 2;
        let center_y = y + target_height as i64 / 2;
        let tlx = center_x - rotated.width() as i64 / 2;
        let tly = center_y - rotated.height() as i64 / 2;
        (rotated, tlx, tly)
    } else {
        (resized_rgba, x, y)
    };

    let (canvas_width, canvas_height) = canvas.dimensions();
    let alpha_mult = (opacity * 255.0) as u8;

    for (px, py, pixel) in final_img.enumerate_pixels() {
        let target_x = top_left_x + px as i64;
        let target_y = top_left_y + py as i64;

        if target_x >= 0
            && target_y >= 0
            && target_x < canvas_width as i64
            && target_y < canvas_height as i64
        {
            let tx = target_x as u32;
            let ty = target_y as u32;

            // Alpha blending
            let src_alpha = ((pixel[3] as u32 * alpha_mult as u32) / 255) as u8;
            if src_alpha > 0 {
                let dst = canvas.get_pixel(tx, ty);
                let inv_alpha = 255 - src_alpha;

                let r = ((pixel[0] as u32 * src_alpha as u32
                    + dst[0] as u32 * inv_alpha as u32)
                    / 255) as u8;
                let g = ((pixel[1] as u32 * src_alpha as u32
                    + dst[1] as u32 * inv_alpha as u32)
                    / 255) as u8;
                let b = ((pixel[2] as u32 * src_alpha as u32
                    + dst[2] as u32 * inv_alpha as u32)
                    / 255) as u8;
                let a = src_alpha.max(dst[3]);

                canvas.put_pixel(tx, ty, Rgba([r, g, b, a]));
            }
        }
    }
}

// Load system font
fn load_system_font(family_name: &str) -> Option<Vec<u8>> {
    use font_kit::family_name::FamilyName;
    use font_kit::properties::Properties;

    let source = SystemSource::new();

    // Try to find the requested font family
    let family = if family_name.is_empty() {
        FamilyName::SansSerif
    } else {
        FamilyName::Title(family_name.to_string())
    };

    if let Ok(handle) = source.select_best_match(&[family, FamilyName::SansSerif], &Properties::new()) {
        if let Ok(font) = handle.load() {
            if let Some(data) = font.copy_font_data() {
                return Some(data.to_vec());
            }
        }
    }

    None
}

// Helper: Measure text width at given font size
fn measure_text_width(font: &FontVec, text: &str, font_size: f32) -> f32 {
    let scaled_font = font.as_scaled(PxScale::from(font_size));
    text.chars()
        .map(|c| {
            let glyph_id = scaled_font.glyph_id(c);
            scaled_font.h_advance(glyph_id)
        })
        .sum()
}

// Helper: Find font size that fits within box width
fn fit_text_to_width(font: &FontVec, text: &str, max_font_size: f32, box_width: f32, min_font_size: f32) -> f32 {
    let mut font_size = max_font_size;

    while font_size > min_font_size {
        let text_width = measure_text_width(font, text, font_size);
        if text_width <= box_width {
            return font_size;
        }
        font_size -= 1.0;
    }

    min_font_size
}

// Helper: Draw rotated text onto canvas with auto-fit
fn draw_rotated_text(
    canvas: &mut RgbaImage,
    text: &str,
    x: i64,
    y: i64,
    width: u32,
    height: u32,
    rotation: f64,
    font_size: f32,
    color: Rgba<u8>,
    font: &FontVec,
    opacity: f64,
) {
    // Create a temporary buffer for the text
    let mut text_buffer: RgbaImage = ImageBuffer::from_pixel(width, height, Rgba([0, 0, 0, 0]));

    // Auto-fit font size to box width (minimum 8px)
    let min_font_size = 8.0;
    let fitted_font_size = fit_text_to_width(font, text, font_size, width as f32, min_font_size);

    let scale = PxScale::from(fitted_font_size);
    draw_text_mut(&mut text_buffer, color, 0, 0, scale, font, text);

    // Apply rotation if needed and calculate top-left position
    let (final_img, top_left_x, top_left_y) = if rotation != 0.0 {
        let rotated = rotate_image(&text_buffer, rotation);
        // Center should be at (x + width/2, y + height/2)
        let center_x = x + width as i64 / 2;
        let center_y = y + height as i64 / 2;
        let tlx = center_x - rotated.width() as i64 / 2;
        let tly = center_y - rotated.height() as i64 / 2;
        (rotated, tlx, tly)
    } else {
        (text_buffer, x, y)
    };

    // Overlay the text buffer onto the canvas
    let (canvas_width, canvas_height) = canvas.dimensions();
    let alpha_mult = (opacity * 255.0) as u8;

    for (px, py, pixel) in final_img.enumerate_pixels() {
        let target_x = top_left_x + px as i64;
        let target_y = top_left_y + py as i64;

        if target_x >= 0
            && target_y >= 0
            && target_x < canvas_width as i64
            && target_y < canvas_height as i64
        {
            let tx = target_x as u32;
            let ty = target_y as u32;

            // Alpha blending
            let src_alpha = ((pixel[3] as u32 * alpha_mult as u32) / 255) as u8;
            if src_alpha > 0 {
                let dst = canvas.get_pixel(tx, ty);
                let inv_alpha = 255 - src_alpha;

                let r = ((pixel[0] as u32 * src_alpha as u32
                    + dst[0] as u32 * inv_alpha as u32)
                    / 255) as u8;
                let g = ((pixel[1] as u32 * src_alpha as u32
                    + dst[1] as u32 * inv_alpha as u32)
                    / 255) as u8;
                let b = ((pixel[2] as u32 * src_alpha as u32
                    + dst[2] as u32 * inv_alpha as u32)
                    / 255) as u8;
                let a = src_alpha.max(dst[3]);

                canvas.put_pixel(tx, ty, Rgba([r, g, b, a]));
            }
        }
    }
}

// Process a single image (runs in blocking thread)
fn process_single_image(
    image_info: &ImageFileInfo,
    visible_objects: &[CanvasObject],
    frame: &FrameSettings,
    table_data: &HashMap<String, HashMap<String, String>>,
    output_path: &Path,
    font_bytes: &[u8],
) -> Result<String, String> {
    // Load font for this thread
    let font = FontVec::try_from_vec(font_bytes.to_vec())
        .map_err(|_| "Failed to load font".to_string())?;

    // Create canvas with background color
    let bg_color = parse_hex_color(&frame.background_color);
    let mut canvas: RgbaImage = ImageBuffer::from_pixel(frame.width, frame.height, bg_color);

    // Load hero image
    let hero_path = Path::new(&image_info.path);
    let hero_image = image::open(hero_path)
        .map_err(|e| format!("Failed to load {}: {}", image_info.name, e))?;

    // Process objects in order (background first, then others)
    for obj in visible_objects {
        match obj.obj_type.as_str() {
            "background" => {
                if let Some(src) = &obj.original_path {
                    if let Ok(bg_img) = image::open(Path::new(src)) {
                        overlay_image(
                            &mut canvas,
                            &bg_img,
                            obj.x as i64,
                            obj.y as i64,
                            obj.width as u32,
                            obj.height as u32,
                            obj.rotation,
                            obj.opacity,
                        );
                    }
                }
            }
            "hero" => {
                overlay_image_fit(
                    &mut canvas,
                    &hero_image,
                    obj.x as i64,
                    obj.y as i64,
                    obj.width as u32,
                    obj.height as u32,
                    obj.rotation,
                    obj.opacity,
                );
            }
            "image" => {
                if let Some(src) = &obj.original_path {
                    if let Ok(img) = image::open(Path::new(src)) {
                        overlay_image(
                            &mut canvas,
                            &img,
                            obj.x as i64,
                            obj.y as i64,
                            obj.width as u32,
                            obj.height as u32,
                            obj.rotation,
                            obj.opacity,
                        );
                    }
                }
            }
            "text" => {
                if let Some(key) = &obj.key {
                    let text_content = table_data
                        .get(&image_info.path)
                        .and_then(|row| row.get(key))
                        .map(|s| s.as_str())
                        .or(obj.content.as_deref())
                        .unwrap_or("");

                    if !text_content.is_empty() {
                        let font_size = obj.font_size.unwrap_or(32) as f32;
                        let color = obj
                            .fill
                            .as_ref()
                            .map(|c| parse_hex_color(c))
                            .unwrap_or(Rgba([0, 0, 0, 255]));

                        draw_rotated_text(
                            &mut canvas,
                            text_content,
                            obj.x as i64,
                            obj.y as i64,
                            obj.width as u32,
                            obj.height as u32,
                            obj.rotation,
                            font_size,
                            color,
                            &font,
                            obj.opacity,
                        );
                    }
                }
            }
            _ => {}
        }
    }

    // Save result
    let output_name = format!(
        "{}_infographic.png",
        hero_path
            .file_stem()
            .map(|s| s.to_string_lossy().to_string())
            .unwrap_or_else(|| "output".to_string())
    );
    let output_file = output_path.join(&output_name);

    canvas
        .save(&output_file)
        .map_err(|e| format!("Failed to save {}: {}", output_name, e))?;

    Ok(output_file.to_string_lossy().to_string())
}

#[tauri::command]
async fn generate_infographics(app: AppHandle, request: GenerateRequest) -> Result<GenerateResult, String> {
    // Create output directory (with template subdirectory if template is active)
    let output_path: PathBuf = if let Some(ref template_name) = request.template_name {
        Path::new(&request.working_directory)
            .join(OUTPUT_DIR)
            .join(template_name)
    } else {
        Path::new(&request.working_directory).join(OUTPUT_DIR)
    };
    fs::create_dir_all(&output_path).map_err(|e| e.to_string())?;

    // Load font bytes (will be cloned for each thread)
    let font_bytes: Arc<Vec<u8>> = Arc::new(
        load_system_font("Arial")
            .or_else(|| load_system_font("Helvetica"))
            .or_else(|| load_system_font(""))
            .ok_or("No system fonts available")?,
    );

    // Get visible objects only
    let visible_objects: Arc<Vec<CanvasObject>> = Arc::new(
        request
            .objects
            .into_iter()
            .filter(|o| o.visible)
            .collect(),
    );

    let total = request.selected_images.len();
    let counter = Arc::new(AtomicUsize::new(0));
    let frame = Arc::new(request.frame);
    let table_data = Arc::new(request.table_data);
    let output_path = Arc::new(output_path);

    // Determine parallelism level
    // Use provided value, or default to half of CPU cores (min 1, max logical cores)
    let max_cores = num_cpus::get();
    let default_parallelism = (max_cores / 2).max(1);
    let parallelism = request.parallelism.unwrap_or(default_parallelism).clamp(1, max_cores);

    // Process images in parallel with limited concurrency
    let results: Vec<Result<String, String>> = stream::iter(request.selected_images)
        .map(|image_info| {
            let app = app.clone();
            let counter = counter.clone();
            let frame = frame.clone();
            let visible_objects = visible_objects.clone();
            let table_data = table_data.clone();
            let output_path = output_path.clone();
            let font_bytes = font_bytes.clone();
            let image_name = image_info.name.clone();

            async move {
                // Run CPU-intensive work in blocking thread
                let result = tokio::task::spawn_blocking(move || {
                    process_single_image(
                        &image_info,
                        &visible_objects,
                        &frame,
                        &table_data,
                        &output_path,
                        &font_bytes,
                    )
                })
                .await
                .map_err(|e| format!("Task failed: {}", e))?;

                // Update progress (atomic counter for thread safety)
                let current = counter.fetch_add(1, Ordering::SeqCst) + 1;
                let _ = app.emit(
                    "generation-progress",
                    GenerationProgress {
                        current,
                        total,
                        current_file: image_name,
                    },
                );

                result
            }
        })
        .buffer_unordered(parallelism)
        .collect()
        .await;

    // Collect results
    let mut generated_files: Vec<String> = Vec::new();
    let mut errors: Vec<String> = Vec::new();

    for result in results {
        match result {
            Ok(path) => generated_files.push(path),
            Err(e) => errors.push(e),
        }
    }

    Ok(GenerateResult {
        success: errors.is_empty(),
        generated_files,
        errors,
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            get_cpu_info,
            get_system_fonts,
            list_images_in_directory,
            save_template,
            load_template,
            list_templates,
            delete_template,
            generate_infographics
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
