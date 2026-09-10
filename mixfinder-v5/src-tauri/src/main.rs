#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use regex::Regex;
use serde::{Deserialize, Serialize};
use std::{fs, path::{Path, PathBuf}, process::Command};
use walkdir::WalkDir;

#[derive(Debug, Serialize, Deserialize, Clone)]
struct Track {
    position: usize,
    file_path: String,
    filename: String,
    display_name: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct Mix {
    mix_name: String,
    mix_path: String,
    modified_at: String,
    track_count: usize,
    tracks: Vec<Track>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct IndexData {
    root_folder: String,
    scanned_at: String,
    mix_count: usize,
    total_uses: usize,
    mixes: Vec<Mix>,
}

fn app_dir() -> PathBuf {
    let mut p = dirs::config_dir().unwrap_or_else(|| PathBuf::from("."));
    p.push("MixFinder");
    let _ = fs::create_dir_all(&p);
    p
}

fn index_path() -> PathBuf { app_dir().join("index.json") }

fn system_time_iso(t: std::time::SystemTime) -> String {
    let dt: chrono::DateTime<chrono::Utc> = t.into();
    dt.to_rfc3339()
}

fn now_iso() -> String { chrono::Utc::now().to_rfc3339() }

fn parse_mmp(path: &Path) -> Result<Mix, String> {
    let bytes = fs::read(path).map_err(|e| e.to_string())?;
    let mut words = Vec::with_capacity(bytes.len() / 2);
    let mut i = 0usize;
    while i + 1 < bytes.len() {
        words.push(u16::from_le_bytes([bytes[i], bytes[i + 1]]));
        i += 2;
    }
    let text = String::from_utf16_lossy(&words);
    let re = Regex::new(r"(?i)[A-Z]:\\[^\x00-\x1F]*?\.mp3").map_err(|e| e.to_string())?;
    let mut tracks = Vec::new();

    for (idx, m) in re.find_iter(&text).enumerate() {
        let p = m.as_str().to_string();
        let filename = p.rsplit('\\').next().unwrap_or("").to_string();
        let display_name = filename
            .strip_suffix(".mp3")
            .or_else(|| filename.strip_suffix(".MP3"))
            .unwrap_or(&filename)
            .to_string();
        tracks.push(Track { position: idx + 1, file_path: p, filename, display_name });
    }

    let meta = fs::metadata(path).map_err(|e| e.to_string())?;
    let modified = meta.modified().map(system_time_iso).unwrap_or_else(|_| "0".into());
    let mix_name = path.file_stem().unwrap_or_default().to_string_lossy().to_string();

    Ok(Mix {
        mix_name,
        mix_path: path.to_string_lossy().to_string(),
        modified_at: modified,
        track_count: tracks.len(),
        tracks,
    })
}

#[tauri::command]
fn load_index() -> Result<Option<IndexData>, String> {
    let p = index_path();
    if !p.exists() { return Ok(None); }
    let s = fs::read_to_string(&p).map_err(|e| e.to_string())?;
    let data = serde_json::from_str::<IndexData>(&s).map_err(|e| e.to_string())?;
    Ok(Some(data))
}

#[tauri::command]
async fn scan_folder(folder: String) -> Result<IndexData, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let mut mixes = Vec::new();
        let mut total_uses = 0usize;

        for entry in WalkDir::new(&folder).into_iter().filter_map(Result::ok) {
            let p = entry.path();
            if !p.is_file() { continue; }
            let is_mmp = p.extension()
                .map(|e| e.to_string_lossy().eq_ignore_ascii_case("mmp"))
                .unwrap_or(false);
            if !is_mmp { continue; }

            if let Ok(mix) = parse_mmp(p) {
                total_uses += mix.track_count;
                mixes.push(mix);
            }
        }

        mixes.sort_by(|a, b| a.mix_name.to_lowercase().cmp(&b.mix_name.to_lowercase()));
        let data = IndexData {
            root_folder: folder.clone(),
            scanned_at: now_iso(),
            mix_count: mixes.len(),
            total_uses,
            mixes,
        };

        let json = serde_json::to_string_pretty(&data).map_err(|e| e.to_string())?;
        fs::write(index_path(), json).map_err(|e| e.to_string())?;
        Ok(data)
    }).await.map_err(|e| e.to_string())?
}

#[tauri::command]
fn open_mix(path: String) -> Result<(), String> {
    if !Path::new(&path).exists() { return Err("Le fichier n'existe plus.".into()); }
    Command::new("explorer")
        .arg(&path)
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn reveal_mix(path: String) -> Result<(), String> {
    if !Path::new(&path).exists() { return Err("Le fichier n'existe plus.".into()); }
    Command::new("explorer")
        .arg(format!("/select,{}", path))
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![load_index, scan_folder, open_mix, reveal_mix])
        .run(tauri::generate_context!())
        .expect("error while running MixFinder");
}
