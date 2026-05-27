// Silent debug logger — buffers every API request/response and ships them to
// /api/SysRun/log in batches every 2 seconds. Fully fire-and-forget so it can
// never block, slow down, or break a user request.
//
// Wired into the global axios instance (config/axios.js). Adds two interceptors:
//   - request: stamps start time + remembers user info
//   - response: builds the event, pushes to buffer
//   - error:    same but with error info
//
// Never logs:
//   - calls to /api/SysRun/* (would recurse forever)
//   - password / token / secret fields (redacted before send)

import { BASE_URL } from '../config/apiConfig';

const FLUSH_INTERVAL_MS = 2000;
const MAX_BUFFER = 50;          // flush early when buffer reaches this
const MAX_PAYLOAD = 64 * 1024;  // truncate payloads above ~64KB
const SENSITIVE_KEYS = /^(password|currentPassword|newPassword|confirmPassword|token|authorization|secret|apikey|api_key)$/i;

const buffer = [];
let flushTimer = null;

// Try to discover the current user. We rely on what Login.jsx stores in
// localStorage at login time — `userRoleId` (user_roles.Id) and `username`.
const getCurrentUser = () => {
  try {
    return {
      id: localStorage.getItem('userRoleId') ? Number(localStorage.getItem('userRoleId')) : null,
      username: localStorage.getItem('username') || null
    };
  } catch {
    return { id: null, username: null };
  }
};

// Walk an object and replace sensitive values with [REDACTED].
const redact = (value) => {
  if (value == null) return value;
  if (Array.isArray(value)) return value.map(redact);
  if (typeof value === 'object') {
    const out = {};
    for (const key of Object.keys(value)) {
      out[key] = SENSITIVE_KEYS.test(key) ? '[REDACTED]' : redact(value[key]);
    }
    return out;
  }
  return value;
};

// Stringify a payload safely. Returns a possibly-truncated string.
const safeStringify = (val) => {
  if (val == null) return null;
  if (typeof val === 'string') return val.length > MAX_PAYLOAD ? val.substring(0, MAX_PAYLOAD) + '…[truncated]' : val;
  try {
    const json = JSON.stringify(redact(val));
    return json.length > MAX_PAYLOAD ? json.substring(0, MAX_PAYLOAD) + '…[truncated]' : json;
  } catch {
    return '[unserializable]';
  }
};

// Derive a human-friendly "module" name from the URL.
// e.g.  /api/Rates/linear/bulk   →  'Rates'
//        /api/Auth/login          →  'Auth'
const deriveModule = (url) => {
  if (!url) return null;
  // Strip protocol+host if present.
  const path = url.replace(/^https?:\/\/[^/]+/i, '');
  const m = path.match(/\/api\/([^/?#]+)/i);
  return m ? m[1] : null;
};

// Should this URL be skipped? (logging endpoint itself, static assets, etc.)
const shouldSkip = (url) => {
  if (!url) return true;
  // Skip our own log endpoint to prevent recursion.
  if (/\/api\/SysRun\/log/i.test(url)) return true;
  return false;
};

const flush = async () => {
  if (buffer.length === 0) return;
  const batch = buffer.splice(0, buffer.length);
  try {
    // Use fetch (not axios) to avoid going through this same interceptor.
    await fetch(`${BASE_URL}/SysRun/log`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: batch }),
      // keepalive lets the request continue even if the page is unloading.
      keepalive: true
    });
  } catch {
    // Swallow — never block the user. If the log POST fails, the events are lost; we accept that.
  }
};

const scheduleFlush = () => {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flush();
  }, FLUSH_INTERVAL_MS);
};

const enqueue = (event) => {
  buffer.push(event);
  if (buffer.length >= MAX_BUFFER) {
    // Flush early to avoid memory growth during heavy activity.
    if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
    flush();
  } else {
    scheduleFlush();
  }
};

// Ensure pending events are sent when the user closes/reloads the tab.
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (buffer.length === 0) return;
    try {
      const blob = new Blob([JSON.stringify({ events: buffer.splice(0, buffer.length) })], { type: 'application/json' });
      // sendBeacon is designed exactly for this — survives page unload.
      navigator.sendBeacon(`${BASE_URL}/SysRun/log`, blob);
    } catch {}
  });
}

// Install the interceptors on a given axios instance.
export function attachSysRunLogger(axiosInstance) {
  axiosInstance.interceptors.request.use((config) => {
    // Stash a start marker on the request config so the response interceptor
    // can compute duration and emit an event.
    try {
      config.__sysRunStart = performance.now();
      config.__sysRunTimestamp = new Date().toISOString();
    } catch {}
    return config;
  });

  axiosInstance.interceptors.response.use(
    (response) => {
      try { emitFromResponse(response, null); } catch {}
      return response;
    },
    (error) => {
      try { emitFromResponse(error.response, error); } catch {}
      return Promise.reject(error);
    }
  );
}

function emitFromResponse(response, error) {
  // The request config might be on response.config OR error.config.
  const config = response?.config || error?.config;
  if (!config) return;

  const url = config.url || '';
  // axios may not include baseURL in config.url; reconstruct full URL for clarity.
  const fullUrl = config.baseURL && !/^https?:/i.test(url) ? config.baseURL + url : url;

  if (shouldSkip(fullUrl)) return;

  const user = getCurrentUser();
  const start = config.__sysRunStart;
  const durationMs = start != null ? Math.round(performance.now() - start) : null;

  enqueue({
    userId: user.id,
    userName: user.username,
    module: deriveModule(fullUrl),
    action: `${(config.method || '').toUpperCase()} ${fullUrl.split('?')[0].split('/').slice(-2).join('/')}`,
    httpMethod: (config.method || '').toUpperCase(),
    url: fullUrl,
    requestPayload: safeStringify(config.data ?? config.params),
    responseStatus: response?.status ?? null,
    responsePayload: response ? safeStringify(response.data) : null,
    errorMessage: error ? (error.message || String(error)) : null,
    durationMs,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    createdAt: config.__sysRunTimestamp || new Date().toISOString()
  });
}
