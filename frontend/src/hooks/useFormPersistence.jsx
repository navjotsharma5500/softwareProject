import { useEffect, useRef, useState } from 'react';

// key: localStorage key
// initialState: initial value when no saved value exists
// options: { debounceMs }
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
        // eslint-disable-next-line no-console
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
