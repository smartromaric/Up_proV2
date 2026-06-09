import { PartnerEditPage } from "@/features/network/pages/PartnerEditPage";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminPartnerEditPage({ params }: PageProps) {
  const { id } = await params;
  return <PartnerEditPage partnerId={id} />;
}
