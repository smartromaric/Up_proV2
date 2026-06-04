"use client";

import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { FranchiseSupportMessageThread } from "../components/FranchiseSupportMessageThread";
import type { SupportReporterType } from "../api/support.service";
import {
  useFranchiseSupportChat,
  useReplyFranchiseChat,
} from "../api/support.queries";

const REPORTER_LABELS: Record<SupportReporterType, string> = {
  partner: "Partenaire",
  driver: "Chauffeur",
  client: "Client",
};

interface FranchiseSupportChatDetailPageProps {
  chatId: string;
}

export function FranchiseSupportChatDetailPage({ chatId }: FranchiseSupportChatDetailPageProps) {
  const { data, isLoading, isError } = useFranchiseSupportChat(chatId);
  const reply = useReplyFranchiseChat(chatId);

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-card bg-border" />;
  }

  if (isError || !data) {
    return (
      <p className="text-sm text-red-600">
        Conversation introuvable.{" "}
        <Link href="/franchise/support/chat" className="text-teal underline">
          Retour
        </Link>
      </p>
    );
  }

  const closed = data.status === "closed";

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={data.participant_name}
        breadcrumb={["Franchise", "Support", "Chat", data.id]}
        actions={
          data.unread_count > 0 ? (
            <span className="rounded-full bg-teal/15 px-3 py-1 text-xs font-medium text-teal-dark">
              {data.unread_count} non lu{data.unread_count > 1 ? "s" : ""}
            </span>
          ) : null
        }
      />

      <p className="mb-2 text-sm text-muted">
        {REPORTER_LABELS[data.participant_type]}
        {data.subject ? ` · ${data.subject}` : ""}
      </p>

      <p className="mb-6 text-sm">
        <Link href="/franchise/support/chat" className="text-teal hover:underline">
          ← Retour aux conversations
        </Link>
      </p>

      <FranchiseSupportMessageThread
        messages={data.messages}
        disabled={closed}
        isSending={reply.isPending}
        onSend={(body) => reply.mutate(body)}
        placeholder={closed ? "Conversation clôturée" : "Répondre dans le chat…"}
      />
    </div>
  );
}
