import { FranchisePromoDetailPage } from "@/features/franchise/pages/FranchisePromoDetailPage";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function FranchisePromoDetailRoutePage({ params }: Props) {
  const { id } = await params;
  return <FranchisePromoDetailPage promoId={id} />;
}
