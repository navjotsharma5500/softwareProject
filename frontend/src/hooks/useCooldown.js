/**
 * @file useCooldown.js
 * @description React hook that enforces a minimum delay between repeated
 * actions (e.g. form re-submissions, button spam).
 */
import { useRef, useState, useCallback } from "react";

/**
 * Returns a `[onCooldown, trigger]` tuple that gates repeated invocations.
 *
 * Calling `trigger()` starts a cooldown window of `ms` milliseconds.
 * While the window is active `onCooldown` is `true` and `trigger()` returns
 * `false` without restarting the timer. After the window expires
 * `onCooldown` resets to `false` and `trigger()` is open again.
 *
 * @param {number} [ms=5000] - Cooldown duration in milliseconds.
 * @returns {[boolean, () => boolean]} Tuple of:
 *   - `onCooldown` – `true` while the cooldown is active.
 *   - `trigger`    – Call to attempt an action; returns `true` if allowed,
 *     `false` if still on cooldown.
 *
 * @example
 * const [onCooldown, trigger] = useCooldown(3000);
 * const handleClick = () => {
 *   if (!trigger()) return; // still on cooldown
 *   submitForm();
 * };
 */
export function useCooldown(ms = 5000) {
  const lastTime = useRef(0);
  const [onCooldown, setOnCooldown] = useState(false);
  const trigger = useCallback(() => {
    const now = Date.now();
    if (now - lastTime.current < ms) return false;
    lastTime.current = now;
    setOnCooldown(true);
    setTimeout(() => setOnCooldown(false), ms);
    return true;
  }, [ms]);
  return [onCooldown, trigger];
}

export default useCooldown;
