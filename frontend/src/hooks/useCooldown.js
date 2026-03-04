import { useRef, useState, useCallback } from "react";

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
