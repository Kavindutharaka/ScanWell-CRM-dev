// Audit log viewer — filterable table of every API call captured by the
// silent sysRunLogger interceptor.
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Terminal, RefreshCw, Search, ChevronDown, ChevronRight,
  CheckCircle2, AlertCircle, Calendar, User as UserIcon, Activity
} from 'lucide-react';
import { BASE_URL } from '../../config/apiConfig';

const PAGE_SIZE_OPTIONS = [25, 50, 100, 200];
const DEFAULT_PAGE_SIZE = 25;

const METHOD_COLORS = {
  GET:    'bg-blue-100 text-blue-700',
  POST:   'bg-emerald-100 text-emerald-700',
  PUT:    'bg-amber-100 text-amber-700',
  PATCH:  'bg-amber-100 text-amber-700',
  DELETE: 'bg-red-100 text-red-700'
};

// Backend stores created_at as UTC via SYSUTCDATETIME() but returns the string
// without a "Z" timezone marker (e.g. "2026-05-27T20:37:07.62"). Without that
// marker, JS `new Date(...)` treats the string as LOCAL time — which makes the
// displayed time appear ~5h30m off in LKR (UTC+5:30). Force UTC interpretation
// by appending "Z" only when the string lacks any timezone info.
const parseAsUtc = (value) => {
  if (!value) return null;
  if (typeof value !== 'string') return new Date(value);
  const hasTz = /Z$|[+-]\d{2}:?\d{2}$/.test(value);
  return new Date(hasTz ? value : value + 'Z');
};

// Format an ISO timestamp into "dd/MM/yyyy HH:mm:ss.SSS" in the viewer's local time.
const formatTimestamp = (utcString) => {
  if (!utcString) return '—';
  try {
    const d = parseAsUtc(utcString);
    if (!d || isNaN(d.getTime())) return utcString;
    // After parseAsUtc, getDate/getHours/etc. return the user's LOCAL components.
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    const ms = String(d.getMilliseconds()).padStart(3, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${mi}:${ss}.${ms}`;
  } catch {
    return utcString;
  }
};

// Try to pretty-print a JSON string. Returns the raw string if it isn't JSON.
const prettify = (s) => {
  if (!s) return '—';
  try { return JSON.stringify(JSON.parse(s), null, 2); }
  catch { return s; }
};

// =============================================================
// EventRow — memoized so unrelated rows don't re-render when a
// neighbour is expanded or its details load.
// =============================================================
const EventRow = React.memo(function EventRow({ event, isExpanded, onToggle, detail, detailLoading }) {
  const isError = (event.response_status != null && event.response_status >= 400) || !!event.error_message;

  return (
    <>
      <tr className="hover:bg-slate-50 cursor-pointer" onClick={() => onToggle(event.id)}>
        <td className="px-2 py-2 text-slate-400">
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </td>
        <td className="px-3 py-2 font-mono text-xs whitespace-nowrap text-slate-700">{formatTimestamp(event.created_at)}</td>
        <td className="px-3 py-2 whitespace-nowrap">
          <span className="text-slate-800 font-medium">{event.user_name || '—'}</span>
          <span className="ml-1 text-xs text-slate-400">#{event.user_id ?? '?'}</span>
        </td>
        <td className="px-3 py-2 whitespace-nowrap text-slate-700">{event.module || '—'}</td>
        <td className="px-3 py-2 text-slate-700 max-w-[260px] truncate" title={event.action}>{event.action || '—'}</td>
        <td className="px-3 py-2">
          <span className={`px-2 py-0.5 rounded text-xs font-mono ${METHOD_COLORS[event.http_method] || 'bg-slate-100 text-slate-700'}`}>{event.http_method || '—'}</span>
        </td>
        <td className="px-3 py-2 text-slate-600 max-w-[380px] truncate font-mono text-xs" title={event.url}>{event.url || '—'}</td>
        <td className="px-3 py-2 whitespace-nowrap">
          {isError
            ? <span className="inline-flex items-center gap-1 text-red-700 text-xs font-medium"><AlertCircle className="w-3.5 h-3.5" />{event.response_status ?? 'ERR'}</span>
            : <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-medium"><CheckCircle2 className="w-3.5 h-3.5" />{event.response_status ?? '—'}</span>
          }
        </td>
        <td className="px-3 py-2 text-right text-xs text-slate-500 font-mono">{event.duration_ms != null ? `${event.duration_ms} ms` : '—'}</td>
      </tr>
      {isExpanded && (
        <tr className="bg-slate-50/60">
          <td></td>
          <td colSpan={8} className="px-4 py-3">
            {detailLoading ? (
              <div className="text-sm text-slate-500 italic">Loading payload…</div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div>
                  <div className="text-xs font-semibold text-slate-500 mb-1">Request Payload</div>
                  <pre className="bg-slate-900 text-slate-200 rounded-lg p-3 text-xs font-mono overflow-x-auto max-h-72">{prettify(detail?.request_payload)}</pre>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500 mb-1">Response Payload</div>
                  <pre className="bg-slate-900 text-slate-200 rounded-lg p-3 text-xs font-mono overflow-x-auto max-h-72">{prettify(detail?.response_payload)}</pre>
                </div>
                {(detail?.error_message || event.error_message) && (
                  <div className="lg:col-span-2">
                    <div className="text-xs font-semibold text-red-600 mb-1">Error</div>
                    <pre className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 text-xs font-mono overflow-x-auto">{detail?.error_message || event.error_message}</pre>
                  </div>
                )}
                <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-600">
                  <div><span className="text-slate-400">Event ID:</span> {event.id}</div>
                  <div><span className="text-slate-400">IP:</span> {event.ip_address || '—'}</div>
                  <div className="col-span-2"><span className="text-slate-400">User-Agent:</span> <span className="text-slate-500">{detail?.user_agent || '—'}</span></div>
                </div>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
});

// =============================================================
// SysRunSec — main page
// =============================================================
export default function SysRunSec() {
  // Data
  const [events, setEvents] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [userId, setUserId] = useState('all');
  const [moduleName, setModuleName] = useState('all');
  const [method, setMethod] = useState('all');
  const [status, setStatus] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState(''); // debounced value actually used for the query

  // Filter dropdowns
  const [users, setUsers] = useState([]);
  const [modules, setModules] = useState([]);

  // Row expansion + per-event detail cache
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [detailsCache, setDetailsCache] = useState({});      // { [id]: { request_payload, response_payload, error_message, user_agent } }
  const [detailLoadingIds, setDetailLoadingIds] = useState(new Set());

  // Debounce the search input so we don't fire a query on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  // The <input type="datetime-local"> gives us a naive local string like
  // "2026-05-27T09:00". The backend expects UTC. Construct a Date (JS parses
  // naive strings as LOCAL time) → toISOString() gives a proper UTC string
  // ending in "Z" that the backend's DateTime.TryParse round-trips correctly.
  const localDatetimeToUtcIso = (localValue) => {
    if (!localValue) return null;
    const d = new Date(localValue);
    return isNaN(d.getTime()) ? null : d.toISOString();
  };

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams();
    const fromUtc = localDatetimeToUtcIso(dateFrom);
    const toUtc   = localDatetimeToUtcIso(dateTo);
    if (fromUtc) params.append('dateFrom', fromUtc);
    if (toUtc)   params.append('dateTo', toUtc);
    if (userId !== 'all') params.append('userId', userId);
    if (moduleName !== 'all') params.append('module', moduleName);
    if (method !== 'all') params.append('method', method);
    if (status !== 'all') params.append('status', status);
    if (search) params.append('search', search);
    params.append('page', String(page));
    params.append('pageSize', String(pageSize));
    return params.toString();
  }, [dateFrom, dateTo, userId, moduleName, method, status, search, page, pageSize]);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/SysRun/events?${buildQuery()}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load events');
      const data = await res.json();
      setEvents(data.data || []);
      setTotalCount(data.totalCount || 0);
    } catch (err) {
      console.error('[SysRun] loadEvents error:', err);
      setEvents([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [buildQuery]);

  const loadFilterOptions = useCallback(async () => {
    try {
      const [uRes, mRes] = await Promise.all([
        fetch(`${BASE_URL}/SysRun/filters/users`,   { credentials: 'include' }),
        fetch(`${BASE_URL}/SysRun/filters/modules`, { credentials: 'include' })
      ]);
      if (uRes.ok) setUsers(await uRes.json());
      if (mRes.ok) setModules(await mRes.json());
    } catch (err) {
      console.error('[SysRun] filter load error:', err);
    }
  }, []);

  useEffect(() => { loadFilterOptions(); }, [loadFilterOptions]);
  useEffect(() => { loadEvents(); }, [loadEvents]);

  // Reset to page 1 + clear expanded/cache when any filter changes
  useEffect(() => {
    setPage(1);
    setExpandedIds(new Set());
    setDetailsCache({});
  }, [dateFrom, dateTo, userId, moduleName, method, status, search, pageSize]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // Lazy-load the full payload for an event the first time it's expanded.
  const fetchDetail = useCallback(async (id) => {
    if (detailsCache[id] != null) return; // already cached
    setDetailLoadingIds((prev) => new Set(prev).add(id));
    try {
      const res = await fetch(`${BASE_URL}/SysRun/events/${id}`, { credentials: 'include' });
      if (res.ok) {
        const detail = await res.json();
        setDetailsCache((prev) => ({ ...prev, [id]: detail }));
      } else {
        setDetailsCache((prev) => ({ ...prev, [id]: { request_payload: null, response_payload: null, error_message: '(failed to load detail)' } }));
      }
    } catch (err) {
      console.error('[SysRun] detail load error:', err);
      setDetailsCache((prev) => ({ ...prev, [id]: { request_payload: null, response_payload: null, error_message: String(err) } }));
    } finally {
      setDetailLoadingIds((prev) => {
        const next = new Set(prev); next.delete(id); return next;
      });
    }
  }, [detailsCache]);

  const toggleExpand = useCallback((id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        // Kick off detail fetch as soon as the row opens.
        fetchDetail(id);
      }
      return next;
    });
  }, [fetchDetail]);

  const exportCsv = () => {
    if (events.length === 0) return;
    const headers = ['id', 'created_at', 'user_id', 'user_name', 'module', 'action', 'http_method', 'url', 'response_status', 'duration_ms', 'error_message'];
    const rows = events.map((e) => headers.map((h) => {
      const v = e[h];
      if (v == null) return '';
      const s = String(v).replace(/"/g, '""');
      return `"${s}"`;
    }).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sysrun-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter clearing helper
  const clearAllFilters = () => {
    setDateFrom(''); setDateTo('');
    setUserId('all'); setModuleName('all'); setMethod('all'); setStatus('all');
    setSearchInput('');
  };

  // Memoize the rendered rows so changing one expansion doesn't re-render others
  const renderedRows = useMemo(() => events.map((event) => (
    <EventRow
      key={event.id}
      event={event}
      isExpanded={expandedIds.has(event.id)}
      onToggle={toggleExpand}
      detail={detailsCache[event.id]}
      detailLoading={detailLoadingIds.has(event.id)}
    />
  )), [events, expandedIds, detailsCache, detailLoadingIds, toggleExpand]);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1800px] mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Terminal className="w-7 h-7 text-violet-600" />
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">System Debug Log</h1>
            <p className="text-sm text-slate-500 mt-0.5">Silent capture of every API call. Retention: 30 days. Admin-only.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadEvents}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white rounded-lg text-sm font-medium transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={exportCsv}
            disabled={events.length === 0}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-lg text-sm font-medium transition"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">From</label>
            <input type="datetime-local" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">To</label>
            <input type="datetime-local" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">User</label>
            <select value={userId} onChange={(e) => setUserId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-violet-500 focus:border-transparent">
              <option value="all">All users</option>
              {users.map((u) => (
                <option key={u.userId} value={u.userId}>{u.userName || `User #${u.userId}`}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Module</label>
            <select value={moduleName} onChange={(e) => setModuleName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-violet-500 focus:border-transparent">
              <option value="all">All modules</option>
              {modules.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Method</label>
            <select value={method} onChange={(e) => setMethod(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-violet-500 focus:border-transparent">
              <option value="all">All methods</option>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-violet-500 focus:border-transparent">
              <option value="all">All</option>
              <option value="success">Success (2xx/3xx)</option>
              <option value="error">Error (4xx/5xx)</option>
            </select>
          </div>
          <div className="sm:col-span-2 lg:col-span-2">
            <label className="block text-xs font-medium text-slate-600 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
                placeholder="URL, action, payload, user… (350ms debounce)"
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-end">
          <button onClick={clearAllFilters} className="text-xs text-slate-500 hover:text-slate-800 underline">
            Clear all filters
          </button>
        </div>
      </div>

      {/* Result summary + page size selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 px-1">
        <span className="text-sm text-slate-500">
          {loading ? 'Loading…' : <>Showing <strong>{events.length}</strong> of <strong>{totalCount.toLocaleString()}</strong> events</>}
        </span>
        <div className="flex items-center gap-3">
          <label className="text-sm text-slate-500 flex items-center gap-2">
            Rows per page:
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="px-2 py-1 border border-slate-300 rounded text-sm bg-white"
            >
              {PAGE_SIZE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <span className="text-sm text-slate-500">Page {page} / {totalPages}</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
              <tr>
                <th className="w-8"></th>
                <th className="px-3 py-2.5 text-left whitespace-nowrap"><Calendar className="w-3.5 h-3.5 inline mr-1" />Timestamp (local)</th>
                <th className="px-3 py-2.5 text-left whitespace-nowrap"><UserIcon className="w-3.5 h-3.5 inline mr-1" />User</th>
                <th className="px-3 py-2.5 text-left whitespace-nowrap"><Activity className="w-3.5 h-3.5 inline mr-1" />Module</th>
                <th className="px-3 py-2.5 text-left">Action</th>
                <th className="px-3 py-2.5 text-left">Method</th>
                <th className="px-3 py-2.5 text-left">URL</th>
                <th className="px-3 py-2.5 text-left">Status</th>
                <th className="px-3 py-2.5 text-right whitespace-nowrap">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {events.length === 0 && !loading && (
                <tr><td colSpan={9} className="text-center text-slate-400 py-10">No events match the current filters.</td></tr>
              )}
              {renderedRows}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1 || loading}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 rounded text-sm font-medium">
              ← Previous
            </button>
            <span className="text-sm text-slate-600">Page {page} of {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages || loading}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 rounded text-sm font-medium">
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
