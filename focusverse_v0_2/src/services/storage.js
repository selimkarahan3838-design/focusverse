import { createInitialState, migrateLegacyState, normalizeState } from '../state/schema.js';

const STORAGE_KEY = 'focusverse';
let lastStorageError = null;

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw);
    return normalizeState(migrateLegacyState(parsed));
  } catch {
    return createInitialState();
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    lastStorageError = null;
    return true;
  } catch (error) {
    lastStorageError = { code: 'storage-write-failed', cause: error };
    return false;
  }
}

export function getStorageError() {
  return lastStorageError;
}

export function clearState() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}
