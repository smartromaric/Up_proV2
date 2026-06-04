import { FranchiseSupportChatDetailPage } from "@/features/franchise/pages/FranchiseSupportChatDetailPage";

export default async function FranchiseSupportChatDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <FranchiseSupportChatDetailPage chatId={id} />;
}
