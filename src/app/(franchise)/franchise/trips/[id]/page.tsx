import { FranchiseTripDetailPage } from "@/features/franchise/pages/FranchiseTripDetailPage";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function FranchiseTripDetailRoutePage({ params }: Props) {
  const { id } = await params;
  return <FranchiseTripDetailPage tripId={id} />;
}
