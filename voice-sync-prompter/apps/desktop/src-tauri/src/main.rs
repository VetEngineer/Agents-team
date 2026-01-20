// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;

use commands::{
    enable_capture_protection,
    disable_capture_protection,
    get_capture_protection_support,
};

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            enable_capture_protection,
            disable_capture_protection,
            get_capture_protection_support,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
