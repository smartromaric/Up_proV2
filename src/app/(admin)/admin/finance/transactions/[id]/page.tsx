import { TransactionDetailPage } from "@/features/finance/pages/TransactionDetailPage";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <TransactionDetailPage transactionId={id} />;
}
