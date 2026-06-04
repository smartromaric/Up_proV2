import { FranchiseSupportTicketDetailPage } from "@/features/franchise/pages/FranchiseSupportTicketDetailPage";

export default async function FranchiseSupportTicketDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <FranchiseSupportTicketDetailPage ticketId={id} />;
}
