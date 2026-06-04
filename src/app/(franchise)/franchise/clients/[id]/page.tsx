import { ClientDetailPage } from "@/features/fleet/pages/ClientDetailPage";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function FranchiseClientDetailRoutePage({ params }: Props) {
  const { id } = await params;
  return <ClientDetailPage clientId={id} portal="franchise" />;
}
