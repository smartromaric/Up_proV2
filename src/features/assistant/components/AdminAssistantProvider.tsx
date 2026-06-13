"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  AdminAssistantFab,
  AdminAssistantPanel,
} from "./AdminAssistantPanel";

interface AdminAssistantUiContextValue {
  open: boolean;
  toggle: () => void;
  close: () => void;
}

const AdminAssistantUiContext =
  createContext<AdminAssistantUiContextValue | null>(null);

export function AdminAssistantProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((v) => !v), []);
  const close = useCallback(() => setOpen(false), []);
  const value = useMemo(
    () => ({ open, toggle, close }),
    [open, toggle, close]
  );

  return (
    <AdminAssistantUiContext.Provider value={value}>
      {children}
      <AdminAssistantPanel open={open} onClose={close} />
    </AdminAssistantUiContext.Provider>
  );
}

export function useAdminAssistantUi(): AdminAssistantUiContextValue {
  const ctx = useContext(AdminAssistantUiContext);
  if (!ctx) {
    throw new Error("useAdminAssistantUi hors AdminAssistantProvider");
  }
  return ctx;
}

export function AdminAssistantTopbarButton() {
  const { open, toggle } = useAdminAssistantUi();
  return <AdminAssistantFab onClick={toggle} active={open} />;
}
