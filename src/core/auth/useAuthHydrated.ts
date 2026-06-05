"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "./authStore";

function readAuthHasHydrated(): boolean {
  const persistApi = useAuthStore.persist;
  if (!persistApi?.hasHydrated) {
    return true;
  }
  return persistApi.hasHydrated();
}

/** Attend la réhydratation du store persisté avant toute décision de redirection. */
export function useAuthHydrated(): boolean {
  const [hydrated, setHydrated] = useState(() => readAuthHasHydrated());

  useEffect(() => {
    const persistApi = useAuthStore.persist;
    if (!persistApi?.onFinishHydration) {
      setHydrated(true);
      return;
    }

    if (persistApi.hasHydrated()) {
      setHydrated(true);
      return;
    }

    return persistApi.onFinishHydration(() => setHydrated(true));
  }, []);

  return hydrated;
}
