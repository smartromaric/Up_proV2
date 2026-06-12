import { AdminSupportChatDetailPage } from "@/features/support/pages/AdminSupportChatDetailPage";

export default async function AdminSupportChatDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminSupportChatDetailPage chatId={id} />;
}
