import { DetailPageSkeleton } from "@/shared/ui/skeletons";

export default function FranchiseDetailLoading() {
  return (
    <DetailPageSkeleton
      title="Franchise"
      breadcrumb={["Admin", "Réseau", "Franchises"]}
      kpiCount={4}
    />
  );
}
