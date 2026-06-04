import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { zustandDevtoolsOptions } from "@/core/store/zustandDevtools";
import type { User } from "@/shared/types";

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  setSession: (
    token: string,
    user: User,
    refreshToken?: string | null
  ) => void;
  clearSession: () => void;
  hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        token: null,
        refreshToken: null,
        user: null,
        setSession: (token, user, refreshToken = null) =>
          set(
            { token, user, refreshToken: refreshToken ?? null },
            false,
            "auth/setSession"
          ),
        clearSession: () =>
          set(
            { token: null, refreshToken: null, user: null },
            false,
            "auth/clearSession"
          ),
        hasPermission: (permission) => {
          const perms = get().user?.permissions ?? [];
          return perms.includes(permission);
        },
      }),
      { name: "upjunoo-auth" }
    ),
    { name: "UpJunooAuth", ...zustandDevtoolsOptions }
  )
);
