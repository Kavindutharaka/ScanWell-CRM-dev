// OnlineEmployees — horizontal strip of avatars showing who's currently active.
// Data source: GET /api/Employee/online-now (driven by sys_event_log).
// Polls every 30s; cleans up the interval on unmount.

import { useEffect, useState, useCallback } from 'react';
import { Users, X } from 'lucide-react';
import { BASE_URL } from '../../config/apiConfig';

const POLL_INTERVAL_MS = 30 * 1000;     // refresh every 30s
const MAX_VISIBLE = 10;                 // number of avatars shown inline; rest in "+N more"

// Build a fully-qualified image URL from the relative path stored in DB
const buildImageSrc = (relUrl) => {
  if (!relUrl) return null;
  if (relUrl.startsWith('http://') || relUrl.startsWith('https://')) return relUrl;
  const apiRoot = BASE_URL.replace(/\/api\/?$/, '');
  return `${apiRoot}${relUrl.startsWith('/') ? '' : '/'}${relUrl}`;
};

// Backend sends UTC timestamps without a "Z" suffix; force UTC parsing so the
// diff against Date.now() (which is UTC ms) is correct. Without this, the time
// gets parsed as local → diff is off by the local UTC offset (5h 30m for LKR).
const parseAsUtc = (value) => {
  if (!value) return null;
  if (typeof value !== 'string') return new Date(value);
  const hasTz = /Z$|[+-]\d{2}:?\d{2}$/.test(value);
  return new Date(hasTz ? value : value + 'Z');
};

// "Active 12s ago" / "Active 3m ago"
const relativeTime = (utcString) => {
  if (!utcString) return '';
  const d = parseAsUtc(utcString);
  if (!d || isNaN(d.getTime())) return '';
  const secs = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
  if (secs < 60) return `Active ${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `Active ${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `Active ${hrs}h ago`;
};

const getInitials = (fname, lname, username) => {
  const f = (fname || '').trim().charAt(0);
  const l = (lname || '').trim().charAt(0);
  if (f || l) return (f + l).toUpperCase();
  // Fallback: first two letters of the username
  const u = (username || '').trim();
  return u ? u.substring(0, 2).toUpperCase() : '?';
};

const displayName = (u) => {
  const full = `${u.fname || ''} ${u.lname || ''}`.trim();
  return full || u.userName || `User #${u.userId}`;
};

// ============================================================
// Avatar (single circle with online dot + tooltip on hover)
// ============================================================
function Avatar({ user }) {
  const [imgError, setImgError] = useState(false);
  const src = !imgError ? buildImageSrc(user.profile_image) : null;

  return (
    <div className="relative group" tabIndex={0}>
      <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-full w-9 h-9 flex items-center justify-center shadow-sm overflow-hidden border-2 border-white ring-1 ring-slate-200">
        {src ? (
          <img
            src={src}
            alt={displayName(user)}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="text-xs font-semibold">{getInitials(user.fname, user.lname, user.userName)}</span>
        )}
      </div>
      {/* Green online dot */}
      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" aria-hidden="true" />

      {/* Hover/focus tooltip */}
      <div className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 z-30 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity">
        <div className="bg-slate-900 text-white text-xs rounded-lg shadow-lg px-3 py-2 whitespace-nowrap">
          <div className="font-semibold">{displayName(user)}</div>
          <div className="text-slate-300 text-[10px] mt-0.5">
            {user.empId != null ? `EMP-${String(user.empId).padStart(3, '0')}` : `User #${user.userId}`}
            <span className="mx-1 text-slate-500">·</span>
            {relativeTime(user.lastSeen)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Overflow modal — full list when there are more than MAX_VISIBLE
// ============================================================
function FullListModal({ users, onClose }) {
  return (
    <div className="fixed inset-0 z-[1500] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-800">
            <Users className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-semibold">Online now ({users.length})</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto p-3">
          {users.map((u) => {
            const src = buildImageSrc(u.profile_image);
            return (
              <div key={u.userId} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50">
                <div className="relative">
                  <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-full w-10 h-10 flex items-center justify-center overflow-hidden">
                    {src
                      ? <img src={src} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                      : <span className="text-sm font-semibold">{getInitials(u.fname, u.lname, u.userName)}</span>}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-800 truncate">{displayName(u)}</div>
                  <div className="text-xs text-slate-500">
                    {u.empId != null ? `EMP-${String(u.empId).padStart(3, '0')}` : `User #${u.userId}`}
                    <span className="mx-1 text-slate-400">·</span>
                    {relativeTime(u.lastSeen)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Main component — the inline strip
// ============================================================
export default function OnlineEmployees() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFullList, setShowFullList] = useState(false);

  const fetchOnline = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/Employee/online-now`, { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      // Silent failure — this widget is informational, never break the page.
      console.error('[OnlineEmployees] fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOnline();
    const id = setInterval(fetchOnline, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchOnline]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-400 mb-4">
        <Users className="w-4 h-4" />
        <span>Loading online status…</span>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-400 mb-4">
        <span className="inline-block w-2 h-2 rounded-full bg-slate-300" />
        <span>No one online right now</span>
      </div>
    );
  }

  const visible = users.slice(0, MAX_VISIBLE);
  const overflow = users.length - visible.length;

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-4 px-4 py-2.5 bg-white border border-slate-200 rounded-lg shadow-sm">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span>Online now</span>
          <span className="text-xs text-slate-500">({users.length})</span>
        </div>
        <div className="flex items-center -space-x-1.5">
          {visible.map((u) => <Avatar key={u.userId} user={u} />)}
        </div>
        {overflow > 0 && (
          <button
            onClick={() => setShowFullList(true)}
            className="ml-1 text-xs font-medium text-emerald-700 hover:text-emerald-800 hover:underline"
          >
            +{overflow} more
          </button>
        )}
      </div>
      {showFullList && <FullListModal users={users} onClose={() => setShowFullList(false)} />}
    </>
  );
}
