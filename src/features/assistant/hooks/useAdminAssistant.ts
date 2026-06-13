"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  executeAssistantConfirmation,
  fetchAssistantBriefing,
  sendAssistantMessage,
} from "../api/assistant.service";
import { buildAssistantPageContext } from "../lib/assistantPageContext";
import { buildContextualSuggestions } from "../lib/assistantSuggestionChips";
import { executeAssistantAction, openEntityDetail } from "../lib/executeAssistantAction";
import type { AdminEntityKey } from "../catalog/adminEntities";
import type {
  AssistantApiResponse,
  AssistantBriefingAlert,
  AssistantChatMessage,
  AssistantConfirmation,
} from "../types";

export interface AssistantUiMessage extends AssistantChatMessage {
  id: string;
  candidates?: AssistantApiResponse["candidates"];
  pendingAction?: boolean;
  confirmation?: AssistantConfirmation | null;
}

const SESSION_KEY = "upjunoo-assistant-recent";

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function loadRecentNav(): Array<{ kind: AdminEntityKey; id: string; label: string }> {
  if (typeof sessionStorage === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Array<{ kind: AdminEntityKey; id: string; label: string }>) : [];
  } catch {
    return [];
  }
}

function pushRecentNav(entry: { kind: AdminEntityKey; id: string; label: string }) {
  if (typeof sessionStorage === "undefined") return;
  const prev = loadRecentNav().filter((e) => !(e.kind === entry.kind && e.id === entry.id));
  sessionStorage.setItem(SESSION_KEY, JSON.stringify([entry, ...prev].slice(0, 8)));
}

export function useAdminAssistant() {
  const router = useRouter();
  const pathname = usePathname();
  const pageContext = useMemo(
    () => buildAssistantPageContext(pathname ?? ""),
    [pathname]
  );

  const [messages, setMessages] = useState<AssistantUiMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Bonjour ! Conformité (« peut-il rouler ? »), KYC, wallet, ops live, workflows dossier, actions confirmées (suspendre, valider KYC, recharger).\n\nOnglet Inscription : déposez vos pièces d'identité.",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [briefing, setBriefing] = useState<{
    greeting: string;
    alerts: AssistantBriefingAlert[];
  } | null>(null);
  const [pendingConfirmation, setPendingConfirmation] =
    useState<AssistantConfirmation | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const loadBriefing = useCallback(async () => {
    try {
      const data = await fetchAssistantBriefing();
      setBriefing(data);
    } catch {
      /* ignore */
    }
  }, []);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      if (/^(retour|revenir)( au| à)? (dernier|précédent|precedent)/i.test(trimmed)) {
        const recent = loadRecentNav()[0];
        if (recent) {
          openEntityDetail(router, recent.kind, recent.id);
          setMessages((prev) => [
            ...prev,
            { id: uid(), role: "user", content: trimmed },
            {
              id: uid(),
              role: "assistant",
              content: `Je rouvre ${recent.label}.`,
            },
          ]);
          return;
        }
      }

      setError(null);
      setPendingConfirmation(null);
      const userMsg: AssistantUiMessage = {
        id: uid(),
        role: "user",
        content: trimmed,
      };
      const nextMessages = [...messages, userMsg];
      setMessages(nextMessages);
      setIsLoading(true);

      try {
        const apiMessages: AssistantChatMessage[] = nextMessages
          .filter((m) => m.id !== "welcome")
          .map(({ role, content }) => ({ role, content }));

        const result = await sendAssistantMessage(apiMessages, pageContext);

        if (result.confirmation) {
          setPendingConfirmation(result.confirmation);
        }

        const navigated = result.confirmation
          ? false
          : executeAssistantAction(result.action, router);

        if (result.action?.type === "OPEN_ENTITY") {
          pushRecentNav({
            kind: result.action.entity,
            id: result.action.id,
            label: result.message.slice(0, 60),
          });
        }

        const assistantMsg: AssistantUiMessage = {
          id: uid(),
          role: "assistant",
          content: result.message,
          candidates: result.candidates,
          pendingAction: Boolean(result.action) && !navigated,
          confirmation: result.confirmation,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : "Impossible de contacter l'assistant.";
        setError(msg);
        setMessages((prev) => [
          ...prev,
          { id: uid(), role: "assistant", content: msg },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, messages, pageContext, router]
  );

  const confirmPendingAction = useCallback(async () => {
    const conf = pendingConfirmation;
    if (!conf || isExecuting) return;

    setIsExecuting(true);
    setError(null);
    try {
      const result = await executeAssistantConfirmation(
        conf.executeType,
        conf.payload
      );
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: "assistant", content: result.message },
      ]);
      setPendingConfirmation(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Action échouée.";
      setError(msg);
    } finally {
      setIsExecuting(false);
    }
  }, [pendingConfirmation, isExecuting]);

  const dismissConfirmation = useCallback(() => {
    setPendingConfirmation(null);
  }, []);

  const openCandidate = useCallback(
    (kind: AdminEntityKey, id: string, label?: string) => {
      pushRecentNav({ kind, id, label: label ?? `${kind} ${id.slice(0, 8)}` });
      openEntityDetail(router, kind, id);
    },
    [router]
  );

  const openBriefingLink = useCallback(
    (href: string) => {
      router.push(href);
    },
    [router]
  );

  const suggestionChips = useMemo(
    () => buildContextualSuggestions(pageContext),
    [pageContext]
  );

  return {
    messages,
    isLoading,
    isExecuting,
    error,
    send,
    openCandidate,
    pageContext,
    briefing,
    loadBriefing,
    pendingConfirmation,
    confirmPendingAction,
    dismissConfirmation,
    openBriefingLink,
    suggestionChips,
  };
}
