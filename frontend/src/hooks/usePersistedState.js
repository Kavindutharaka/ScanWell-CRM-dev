// usePersistedState — drop-in replacement for useState that survives page reloads.
//
// Usage:
//   const [activeTab, setActiveTab] = usePersistedState('rates.activeTab', 'air');
//
// Behavior:
// - Keyed per logged-in user, so two users on the same browser don't share state.
// - Survives browser close and explicit logout — restored on next login.
// - Auto-expires after 30 days so stale state doesn't linger forever.
// - Falls through silently if localStorage is full / disabled.

import { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';

const STALE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const buildKey = (userId, key) => `crm:state:${userId || 'anon'}:${key}`;

const readFromStorage = (storageKey, defaultValue) => {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return defaultValue;
    const parsed = JSON.parse(raw);
    if (parsed.timestamp && Date.now() - parsed.timestamp > STALE_MS) {
      localStorage.removeItem(storageKey);
      return defaultValue;
    }
    return parsed.value !== undefined ? parsed.value : defaultValue;
  } catch {
    return defaultValue;
  }
};

export function usePersistedState(key, defaultValue) {
  const { user } = useContext(AuthContext);
  const userId = user?.id;

  // Initial read uses whatever userId we know at mount time (often 'anon' on a cold app load).
  const [value, setValue] = useState(() => readFromStorage(buildKey(userId, key), defaultValue));

  // Track the value we last persisted (or just read) so we never re-save the *same* value back.
  // This is what prevents the "userId-arrives-after-mount" race: when AuthContext finally
  // populates the user, both the read effect (which schedules setValue with the persisted value)
  // and the save effect fire in the same commit pass. Without this guard, the save effect would
  // see the still-stale local `value` and overwrite the persisted value with the default.
  const lastSyncedValueRef = useRef(value);

  // When userId becomes available AFTER mount (auth resolves), re-read with the correct key.
  const syncedUserIdRef = useRef(userId);
  useEffect(() => {
    if (userId && userId !== syncedUserIdRef.current) {
      syncedUserIdRef.current = userId;
      const stored = readFromStorage(buildKey(userId, key), undefined);
      if (stored !== undefined) {
        setValue(stored);
        lastSyncedValueRef.current = stored;
      }
    }
  }, [userId, key]);

  // Persist on change — but skip if the value is identical to what we last read/wrote.
  // This makes the save idempotent and immune to the initialization race described above.
  useEffect(() => {
    if (!userId) return;
    if (Object.is(value, lastSyncedValueRef.current)) return;
    try {
      localStorage.setItem(
        buildKey(userId, key),
        JSON.stringify({ value, timestamp: Date.now() })
      );
      lastSyncedValueRef.current = value;
    } catch {
      // localStorage might be full or in private-browsing mode — fail silently.
    }
  }, [userId, key, value]);

  return [value, setValue];
}
