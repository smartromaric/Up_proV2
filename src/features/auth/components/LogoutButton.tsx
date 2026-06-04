"use client";

import { Button } from "@/shared/ui/Button";
import { useLogoutMutation } from "../api/auth.mutations";

interface LogoutButtonProps {
  loginPath: string;
  className?: string;
}

export function LogoutButton({ loginPath, className }: LogoutButtonProps) {
  const logout = useLogoutMutation(loginPath);

  return (
    <Button
      variant="ghost"
      className={className ?? "!py-1.5 !px-2 text-xs"}
      disabled={logout.isPending}
      onClick={() => logout.mutate()}
    >
      {logout.isPending ? "Déconnexion…" : "Déconnexion"}
    </Button>
  );
}
