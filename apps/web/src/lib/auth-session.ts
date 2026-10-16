let session = { revision: 0, enabled: true };
const serverSession = { revision: 0, enabled: true };
let legacyStorageCleared = false;
const listeners = new Set<() => void>();

function clearLegacyTokenStorage() {
  if (legacyStorageCleared || typeof window === "undefined") return;
  legacyStorageCleared = true;
  try {
    window.localStorage.removeItem("token");
  } catch {
    legacyStorageCleared = true;
  }
  document.cookie = "token=; path=/; max-age=0; samesite=lax";
}

export function subscribeToAuthSession(listener: () => void) {
  clearLegacyTokenStorage();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getAuthSessionRevision() {
  return session;
}

export function getServerAuthSessionRevision() {
  return serverSession;
}

export function publishAuthSessionChange(enabled: boolean) {
  session = { revision: session.revision + 1, enabled };
  listeners.forEach((listener) => listener());
  return session.revision;
}
