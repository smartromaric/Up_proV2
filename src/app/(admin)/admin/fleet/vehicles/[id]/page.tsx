import { AdminVehicleDetailPage } from "@/features/fleet/pages/AdminVehicleDetailPage";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ partner_id?: string }>;
}

export default async function AdminVehicleDetailRoute({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const { partner_id: partnerId } = await searchParams;
  return <AdminVehicleDetailPage vehicleId={id} partnerId={partnerId} />;
}
