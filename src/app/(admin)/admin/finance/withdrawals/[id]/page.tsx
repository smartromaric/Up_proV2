import { WithdrawalDetailPage } from "@/features/finance/pages/WithdrawalDetailPage";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <WithdrawalDetailPage withdrawalId={id} />;
}
