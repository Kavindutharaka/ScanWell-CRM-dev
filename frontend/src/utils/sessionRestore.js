// Session restore helpers — last route the user was on, per user, persisted in localStorage.
// Used by RouteTracker (to write) and Login (to read on next login).

const KEY_PREFIX = 'crm:lastRoute:';
const STALE_MS = 7 * 24 * 60 * 60 * 1000; // ignore anything older than 7 days

// Paths we never want to restore TO — there's no point reopening an empty login page.
const SKIP_PATHS = ['/login', '/logout'];

export function saveLastRoute(userId, { path, search }) {
  if (!userId) return;
  if (!path || SKIP_PATHS.includes(path)) return;
  try {
    localStorage.setItem(
      `${KEY_PREFIX}${userId}`,
      JSON.stringify({ path, search: search || '', timestamp: Date.now() })
    );
  } catch {
    // localStorage unavailable — silently skip.
  }
}

export function getLastRoute(userId) {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(`${KEY_PREFIX}${userId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed.path || SKIP_PATHS.includes(parsed.path)) return null;
    if (parsed.timestamp && Date.now() - parsed.timestamp > STALE_MS) {
      localStorage.removeItem(`${KEY_PREFIX}${userId}`);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearLastRoute(userId) {
  if (!userId) return;
  try { localStorage.removeItem(`${KEY_PREFIX}${userId}`); } catch {}
}
