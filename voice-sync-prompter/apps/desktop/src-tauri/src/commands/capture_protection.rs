use tauri::{AppHandle, Runtime, Window};

#[derive(Debug, Clone, serde::Serialize)]
pub struct CaptureProtectionStatus {
    pub enabled: bool,
    pub supported: bool,
    pub platform: String,
    pub message: Option<String>,
}

/// Windows 화면 캡처 방지
#[cfg(target_os = "windows")]
pub fn enable_capture_protection_impl<R: Runtime>(window: &Window<R>) -> Result<CaptureProtectionStatus, String> {
    use windows::Win32::Foundation::HWND;
    use windows::Win32::UI::WindowsAndMessaging::{SetWindowDisplayAffinity, WDA_EXCLUDEFROMCAPTURE};

    let hwnd = window.hwnd().map_err(|e| e.to_string())?;
    let hwnd = HWND(hwnd.0);

    unsafe {
        SetWindowDisplayAffinity(hwnd, WDA_EXCLUDEFROMCAPTURE)
            .map_err(|e| format!("SetWindowDisplayAffinity failed: {}", e))?;
    }

    Ok(CaptureProtectionStatus {
        enabled: true,
        supported: true,
        platform: "windows".to_string(),
        message: Some("화면 캡처 방지가 활성화되었습니다. OBS 등의 녹화 프로그램에서 이 창이 검은색으로 표시됩니다.".to_string()),
    })
}

/// macOS 화면 캡처 방지
#[cfg(target_os = "macos")]
pub fn enable_capture_protection_impl<R: Runtime>(window: &Window<R>) -> Result<CaptureProtectionStatus, String> {
    use cocoa::appkit::NSWindow;
    use cocoa::base::id;
    use objc::runtime::YES;

    // macOS 버전 체크
    let os_version = get_macos_version();

    if os_version.0 >= 15 {
        // macOS 15 (Sequoia) 이상에서는 API가 작동하지 않음
        return Ok(CaptureProtectionStatus {
            enabled: false,
            supported: false,
            platform: "macos".to_string(),
            message: Some(
                "macOS 15 이상에서는 화면 캡처 방지가 지원되지 않습니다. \
                OBS에서 수동으로 이 창을 녹화 대상에서 제외해주세요.".to_string()
            ),
        });
    }

    let ns_window = window.ns_window().map_err(|e| e.to_string())? as id;

    unsafe {
        // NSWindowSharingNone = 0
        let _: () = objc::msg_send![ns_window, setSharingType: 0i64];
    }

    Ok(CaptureProtectionStatus {
        enabled: true,
        supported: true,
        platform: "macos".to_string(),
        message: Some("화면 캡처 방지가 활성화되었습니다.".to_string()),
    })
}

/// Linux에서는 지원하지 않음
#[cfg(target_os = "linux")]
pub fn enable_capture_protection_impl<R: Runtime>(_window: &Window<R>) -> Result<CaptureProtectionStatus, String> {
    Ok(CaptureProtectionStatus {
        enabled: false,
        supported: false,
        platform: "linux".to_string(),
        message: Some("Linux에서는 화면 캡처 방지가 지원되지 않습니다.".to_string()),
    })
}

/// Windows 화면 캡처 방지 해제
#[cfg(target_os = "windows")]
pub fn disable_capture_protection_impl<R: Runtime>(window: &Window<R>) -> Result<CaptureProtectionStatus, String> {
    use windows::Win32::Foundation::HWND;
    use windows::Win32::UI::WindowsAndMessaging::{SetWindowDisplayAffinity, WDA_NONE};

    let hwnd = window.hwnd().map_err(|e| e.to_string())?;
    let hwnd = HWND(hwnd.0);

    unsafe {
        SetWindowDisplayAffinity(hwnd, WDA_NONE)
            .map_err(|e| format!("SetWindowDisplayAffinity failed: {}", e))?;
    }

    Ok(CaptureProtectionStatus {
        enabled: false,
        supported: true,
        platform: "windows".to_string(),
        message: Some("화면 캡처 방지가 해제되었습니다.".to_string()),
    })
}

/// macOS 화면 캡처 방지 해제
#[cfg(target_os = "macos")]
pub fn disable_capture_protection_impl<R: Runtime>(window: &Window<R>) -> Result<CaptureProtectionStatus, String> {
    use cocoa::base::id;

    let os_version = get_macos_version();

    if os_version.0 >= 15 {
        return Ok(CaptureProtectionStatus {
            enabled: false,
            supported: false,
            platform: "macos".to_string(),
            message: None,
        });
    }

    let ns_window = window.ns_window().map_err(|e| e.to_string())? as id;

    unsafe {
        // NSWindowSharingReadOnly = 1
        let _: () = objc::msg_send![ns_window, setSharingType: 1i64];
    }

    Ok(CaptureProtectionStatus {
        enabled: false,
        supported: true,
        platform: "macos".to_string(),
        message: Some("화면 캡처 방지가 해제되었습니다.".to_string()),
    })
}

#[cfg(target_os = "linux")]
pub fn disable_capture_protection_impl<R: Runtime>(_window: &Window<R>) -> Result<CaptureProtectionStatus, String> {
    Ok(CaptureProtectionStatus {
        enabled: false,
        supported: false,
        platform: "linux".to_string(),
        message: None,
    })
}

/// macOS 버전 가져오기
#[cfg(target_os = "macos")]
fn get_macos_version() -> (u32, u32, u32) {
    use std::process::Command;

    let output = Command::new("sw_vers")
        .arg("-productVersion")
        .output()
        .ok();

    if let Some(output) = output {
        let version_str = String::from_utf8_lossy(&output.stdout);
        let parts: Vec<u32> = version_str
            .trim()
            .split('.')
            .filter_map(|s| s.parse().ok())
            .collect();

        return (
            parts.get(0).copied().unwrap_or(0),
            parts.get(1).copied().unwrap_or(0),
            parts.get(2).copied().unwrap_or(0),
        );
    }

    (0, 0, 0)
}

/// 현재 플랫폼의 화면 캡처 방지 지원 상태 확인
#[tauri::command]
pub fn get_capture_protection_support() -> CaptureProtectionStatus {
    #[cfg(target_os = "windows")]
    {
        CaptureProtectionStatus {
            enabled: false,
            supported: true,
            platform: "windows".to_string(),
            message: Some("Windows 10 v2004 이상에서 완벽하게 지원됩니다.".to_string()),
        }
    }

    #[cfg(target_os = "macos")]
    {
        let version = get_macos_version();
        if version.0 >= 15 {
            CaptureProtectionStatus {
                enabled: false,
                supported: false,
                platform: "macos".to_string(),
                message: Some(
                    "macOS 15 (Sequoia) 이상에서는 Apple 정책 변경으로 화면 캡처 방지가 지원되지 않습니다. \
                    OBS 설정에서 수동으로 창을 제외해주세요.".to_string()
                ),
            }
        } else {
            CaptureProtectionStatus {
                enabled: false,
                supported: true,
                platform: "macos".to_string(),
                message: Some(format!("macOS {}.{} - 화면 캡처 방지가 지원됩니다.", version.0, version.1)),
            }
        }
    }

    #[cfg(target_os = "linux")]
    {
        CaptureProtectionStatus {
            enabled: false,
            supported: false,
            platform: "linux".to_string(),
            message: Some("Linux에서는 화면 캡처 방지가 지원되지 않습니다.".to_string()),
        }
    }
}

/// 화면 캡처 방지 활성화
#[tauri::command]
pub fn enable_capture_protection<R: Runtime>(window: Window<R>) -> Result<CaptureProtectionStatus, String> {
    enable_capture_protection_impl(&window)
}

/// 화면 캡처 방지 비활성화
#[tauri::command]
pub fn disable_capture_protection<R: Runtime>(window: Window<R>) -> Result<CaptureProtectionStatus, String> {
    disable_capture_protection_impl(&window)
}
