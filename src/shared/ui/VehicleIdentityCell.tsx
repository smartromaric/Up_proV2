"use client";

import Link from "next/link";
import type { Vehicle } from "@/shared/types";
import { inferVehicleKind } from "@/shared/lib/vehicleKind";
import { IvorianPlateBadge } from "./IvorianPlateBadge";
import { VehicleKindIcon } from "./VehicleKindIcon";
import { VehicleTypeBadge } from "./VehicleTypeBadge";

interface VehicleIdentityCellProps {
  vehicle: Vehicle;
  href: string;
}

export function VehicleIdentityCell({ vehicle, href }: VehicleIdentityCellProps) {
  const kind = inferVehicleKind(vehicle);
  const label =
    vehicle.label?.trim() ||
    [vehicle.brand, vehicle.model].filter(Boolean).join(" ") ||
    "Véhicule";

  return (
    <div className="flex flex-col gap-3 py-0.5">
      <div className="flex items-center gap-3">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-canvas text-teal"
          aria-hidden
        >
          <VehicleKindIcon kind={kind} size={18} />
        </span>
        <Link
          href={href}
          className="min-w-0 font-medium leading-snug text-foreground hover:text-teal"
        >
          {label}
        </Link>
      </div>

      <div className="pl-12">
        {vehicle.plate ? (
          <IvorianPlateBadge plate={vehicle.plate} size="sm" />
        ) : (
          <p className="text-xs text-muted">Plaque à renseigner</p>
        )}
      </div>

      <div className="pl-12">
        <VehicleTypeBadge vehicle={vehicle} showKind={false} />
      </div>
    </div>
  );
}
