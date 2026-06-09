import { FranchiseEditPage } from "@/features/network/pages/FranchiseEditPage";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminFranchiseEditPage({ params }: PageProps) {
  const { id } = await params;
  return <FranchiseEditPage franchiseId={id} />;
}
