/**
 * @file useDebounce.js
 * @description React hook that delays updating a value until a given
 * idle period has elapsed — prevents expensive operations (API calls,
 * filtering) from firing on every keystroke.
 */
import { useState, useEffect } from "react";

/**
 * Returns a debounced version of `value` that only updates after `delay`
 * milliseconds of inactivity.
 *
 * A `clearTimeout` cleanup in the `useEffect` cancels any pending timer when
 * `value` or `delay` changes before the delay has elapsed.
 *
 * @template T
 * @param {T}      value       - The value to debounce.
 * @param {number} [delay=400] - Idle time in milliseconds before updating.
 * @returns {T} The debounced value.
 *
 * @example
 * const debouncedSearch = useDebounce(searchQuery, 400);
 * useEffect(() => { fetchResults(debouncedSearch); }, [debouncedSearch]);
 */
export function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default useDebounce;
