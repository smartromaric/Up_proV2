"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Applique les filtres initiaux depuis l'URL (?account_status=pending, etc.)
 * une seule fois au montage.
 */
export function useInitialUrlFilter<T extends string>(
  param: string,
  allowed: readonly T[],
  setter: (value: T) => void,
  defaultValue: T
): void {
  const searchParams = useSearchParams();
  const applied = useRef(false);

  useEffect(() => {
    if (applied.current) return;
    const raw = searchParams.get(param);
    if (raw && (allowed as readonly string[]).includes(raw)) {
      setter(raw as T);
      applied.current = true;
    } else if (raw) {
      applied.current = true;
    }
  }, [searchParams, param, allowed, setter, defaultValue]);
}
