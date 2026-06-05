import { DetailPageSkeleton } from "@/shared/ui/skeletons";

export default function PartnerDetailLoading() {
  return (
    <DetailPageSkeleton
      title="Partenaire"
      breadcrumb={["Admin", "Réseau", "Partenaires"]}
    />
  );
}
