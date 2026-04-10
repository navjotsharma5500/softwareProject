/**
 * @file useFormPersistence.jsx
 * @description React hook that keeps a form's state in sync with
 * `localStorage`, so that WIP form data survives a page refresh.
 */
import { useEffect, useRef, useState } from 'react';

/**
 * Persists form state to `localStorage` with debounced writes.
 *
 * On mount, attempts to restore state from storage; if nothing is saved yet
 * the provided `initialState` is used and immediately written to storage.
 * Subsequent state updates are debounced by `debounceMs` ms before the write
 * fires, preventing excessive I/O on rapid typing.
 *
 * @param {string} key           - `localStorage` key under which state is stored.
 * @param {*}      initialState  - Value used when nothing is found in storage.
 * @param {object} [options={}]
 * @param {number} [options.debounceMs=300] - Debounce delay for writes in ms.
 *
 * @returns {[*, Function, { clear: Function, replaceIfEmpty: Function }]}
 *   - `state`           — The current form state (restored from storage or `initialState`).
 *   - `setState`        — Standard React state setter; triggers a debounced storage write.
 *   - `clear(next?)`    — Removes the storage entry and resets state to `next` (or `initialState`).
 *   - `replaceIfEmpty(newInitial)` — Updates state only when storage contains no existing value.
 */
export default function useFormPersistence(key, initialState, options = {}) {
  const { debounceMs = 300 } = options;
  const mountedRef = useRef(false);
  const timerRef = useRef(null);

  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initialState;
    } catch (e) {
      return initialState;
    }
  });

  useEffect(() => {
    // On unmount clear pending timer
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // On first mount, ensure storage contains the initial value
    if (!mountedRef.current) {
      mountedRef.current = true;
      try {
        const raw = localStorage.getItem(key);
        if (!raw) localStorage.setItem(key, JSON.stringify(state));
      } catch (e) {}
      return;
    }

    // Debounced write to localStorage
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(state));
      } catch (e) {
        // best-effort: log but don't throw
        console.error('Failed to persist form state', e);
      }
      timerRef.current = null;
    }, debounceMs);

    // cleanup if key or state changes before timeout   
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [key, state, debounceMs]);

  const clear = (nextState = initialState) => {
    try {
      localStorage.removeItem(key);
    } catch (e) {}
    setState(nextState);
  };

  // Only set initial values if there's nothing in storage
  const replaceIfEmpty = (newInitial) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) setState(newInitial);
    } catch (e) {
      setState(newInitial);
    }
  };

  return [state, setState, { clear, replaceIfEmpty }];
}
