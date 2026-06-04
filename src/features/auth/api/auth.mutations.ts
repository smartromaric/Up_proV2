"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/core/auth/authStore";
import { clearAuthCookie, setAuthCookie } from "@/core/auth/authCookie";
import { AppError } from "@/core/http/errorHandler";
import { notificationService } from "@/core/http/notificationService";
import { DASHBOARD_BY_PORTAL } from "@/core/auth/authRoutes";
import { authService, type LoginPayload } from "./auth.service";

export function useLogoutMutation(loginPath: string) {
  const clearSession = useAuthStore((s) => s.clearSession);

  return useMutation({
    mutationFn: () => authService.logout(),
    onSettled: () => {
      clearSession();
      clearAuthCookie();
      window.location.href = loginPath;
    },
  });
}

export function useLoginMutation(portal: LoginPayload["portal"]) {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  return useMutation({
    mutationFn: (payload: Omit<LoginPayload, "portal">) =>
      authService.login({ ...payload, portal }),
    onSuccess: (data) => {
      setSession(data.token, data.user, data.refreshToken);
      setAuthCookie();
      notificationService.success("Connexion réussie");
      router.push(DASHBOARD_BY_PORTAL[portal]);
    },
    onError: (error: unknown) => {
      const message =
        error instanceof AppError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Email ou mot de passe incorrect";
      notificationService.error(message);
    },
  });
}
