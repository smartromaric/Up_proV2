"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/Button";
import { formatDateTime } from "@/shared/lib/format";
import type { AdminSupportMessage } from "../api/adminChat.types";

interface SupportMessageThreadProps {
  messages: AdminSupportMessage[];
  onSend: (body: string) => void;
  isSending?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function SupportMessageThread({
  messages,
  onSend,
  isSending,
  disabled,
  placeholder = "Écrire une réponse…",
}: SupportMessageThreadProps) {
  const [draft, setDraft] = useState("");

  return (
    <div className="flex min-h-[420px] flex-col rounded-card border border-border bg-surface shadow-card">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-muted">Aucun message pour le moment.</p>
        ) : (
          messages.map((m) => {
            const isAgent = m.role === "agent";
            const isSystem = m.role === "system";
            return (
              <div
                key={m.id}
                className={`flex ${isAgent ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    isSystem
                      ? "mx-auto bg-canvas text-center text-xs text-muted"
                      : isAgent
                        ? "bg-teal text-white"
                        : "bg-canvas text-foreground"
                  }`}
                >
                  {!isSystem && (
                    <p
                      className={`mb-1 text-xs font-medium ${
                        isAgent ? "text-teal-100" : "text-muted"
                      }`}
                    >
                      {m.author}
                    </p>
                  )}
                  <p className="whitespace-pre-wrap">{m.body}</p>
                  {!isSystem && (
                    <p
                      className={`mt-1 text-[10px] ${
                        isAgent ? "text-teal-100/80" : "text-muted"
                      }`}
                    >
                      {formatDateTime(m.at)}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {!disabled && (
        <form
          className="flex gap-2 border-t border-border p-4"
          onSubmit={(e) => {
            e.preventDefault();
            const text = draft.trim();
            if (!text) return;
            onSend(text);
            setDraft("");
          }}
        >
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={2}
            placeholder={placeholder}
            className="min-h-[44px] flex-1 resize-none rounded-lg border border-border bg-canvas px-3 py-2 text-sm outline-none ring-teal/30 focus:ring-2"
          />
          <Button type="submit" disabled={isSending || !draft.trim()}>
            {isSending ? "…" : "Envoyer"}
          </Button>
        </form>
      )}
    </div>
  );
}
