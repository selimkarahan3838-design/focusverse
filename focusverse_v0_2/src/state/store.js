import { loadState, saveState, getStorageError } from '../services/storage.js';
import { normalizeState, validateState } from './schema.js';

export function createStore({ onStorageError } = {}) {
  let state = loadState();
  const listeners = new Set();
  const loadError = getStorageError();
  if (loadError) onStorageError?.(loadError);

  return {
    getState: () => state,
    setState(updater) {
      const candidate = typeof updater === 'function' ? updater(state) : updater;
      const normalized = candidate && typeof candidate === 'object' ? normalizeState(candidate) : null;
      if (!candidate || typeof candidate !== 'object' || !validateState(candidate) || !validateState(normalized)) {
        onStorageError?.({ code: 'invalid-state-update', cause: new Error('State update failed validation.') });
        return state;
      }
      state = normalized;
      if (!saveState(state)) onStorageError?.(getStorageError());
      listeners.forEach(listener => listener(state));
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };
}
