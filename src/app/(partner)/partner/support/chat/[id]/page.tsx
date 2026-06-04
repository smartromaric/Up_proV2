import { PartnerSupportChatDetailPage } from "@/features/partner/pages/PartnerSupportChatDetailPage";

export default async function PartnerSupportChatDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PartnerSupportChatDetailPage chatId={id} />;
}
