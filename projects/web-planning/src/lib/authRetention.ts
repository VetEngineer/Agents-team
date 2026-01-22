export const KEEP_LOGIN_REQUEST_KEY = "web-planning:keep-login-requested";
export const KEEP_LOGIN_UNTIL_KEY = "web-planning:keep-login-until";
export const KEEP_LOGIN_DURATION_MS = 24 * 60 * 60 * 1000;

export function setKeepLoginRequested(enabled: boolean) {
  if (typeof window === "undefined") {
    return;
  }

  if (enabled) {
    localStorage.setItem(KEEP_LOGIN_REQUEST_KEY, "1");
    return;
  }

  localStorage.removeItem(KEEP_LOGIN_REQUEST_KEY);
  localStorage.removeItem(KEEP_LOGIN_UNTIL_KEY);
}

export function applyKeepLoginWindow() {
  if (typeof window === "undefined") {
    return;
  }

  const requested = localStorage.getItem(KEEP_LOGIN_REQUEST_KEY) === "1";
  localStorage.removeItem(KEEP_LOGIN_REQUEST_KEY);

  if (requested) {
    const expiresAt = Date.now() + KEEP_LOGIN_DURATION_MS;
    localStorage.setItem(KEEP_LOGIN_UNTIL_KEY, String(expiresAt));
    return;
  }

  localStorage.removeItem(KEEP_LOGIN_UNTIL_KEY);
}

export function getKeepLoginUntil() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = localStorage.getItem(KEEP_LOGIN_UNTIL_KEY);
  if (!raw) {
    return null;
  }

  const value = Number(raw);
  if (!Number.isFinite(value)) {
    localStorage.removeItem(KEEP_LOGIN_UNTIL_KEY);
    return null;
  }

  return value;
}

export function clearKeepLoginWindow() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(KEEP_LOGIN_REQUEST_KEY);
  localStorage.removeItem(KEEP_LOGIN_UNTIL_KEY);
}
