"use client";

import { DetailPageSkeleton } from "@/shared/ui/skeletons";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { FranchiseSupportMessageThread } from "@/features/franchise/components/FranchiseSupportMessageThread";
import {
  usePartnerSupportChat,
  useReplyPartnerChat,
} from "../api/support.queries";

interface PartnerSupportChatDetailPageProps {
  chatId: string;
}

export function PartnerSupportChatDetailPage({ chatId }: PartnerSupportChatDetailPageProps) {
  const { data, isLoading, isError } = usePartnerSupportChat(chatId);
  const reply = useReplyPartnerChat(chatId);

  if (isLoading) {
    return <DetailPageSkeleton />;
  }

  if (isError || !data) {
    return (
      <p className="text-sm text-red-600">
        Conversation introuvable.{" "}
        <Link href="/partner/support/chat" className="text-teal underline">
          Retour
        </Link>
      </p>
    );
  }

  const closed = data.status === "closed";
  const title = data.subject ?? "Support franchise";

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={title}
        breadcrumb={["Partenaire", "Support", "Chat", data.id]}
        actions={
          data.unread_count > 0 ? (
            <span className="rounded-full bg-teal/15 px-3 py-1 text-xs font-medium text-teal-dark">
              {data.unread_count} non lu{data.unread_count > 1 ? "s" : ""}
            </span>
          ) : null
        }
      />

      <p className="mb-2 text-sm text-muted">Support franchise · Côte d&apos;Ivoire</p>

      <p className="mb-6 text-sm">
        <Link href="/partner/support/chat" className="text-teal hover:underline">
          ← Retour aux conversations
        </Link>
      </p>

      <FranchiseSupportMessageThread
        messages={data.messages}
        disabled={closed}
        isSending={reply.isPending}
        onSend={(body) => reply.mutate(body)}
        placeholder={
          closed ? "Conversation clôturée" : "Écrire au support franchise…"
        }
      />
    </div>
  );
}
