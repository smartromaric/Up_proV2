import { VehicleCreatePage } from "@/features/fleet/pages/VehicleCreatePage";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <VehicleCreatePage lockedPartnerId={id} />;
}
