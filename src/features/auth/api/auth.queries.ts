"use client";

import { useQuery } from "@tanstack/react-query";
import { env } from "@/core/config/env";
import { useAuthStore } from "@/core/auth/authStore";
import { authService } from "./auth.service";

function shouldSyncProfileFromApi(): boolean {
  return env.useRealAuth || !env.useMocks;
}

export function useAuthMeQuery() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const setSession = useAuthStore((s) => s.setSession);
  const refreshToken = useAuthStore((s) => s.refreshToken);

  return useQuery({
    queryKey: ["auth", "me", token],
    queryFn: async () => {
      const profile = await authService.me();
      if (token) {
        setSession(token, profile, refreshToken);
      }
      return profile;
    },
    enabled: Boolean(token && user && shouldSyncProfileFromApi()),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
