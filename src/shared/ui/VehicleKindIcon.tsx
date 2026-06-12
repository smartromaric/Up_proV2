import type { VehicleKind } from "@/shared/lib/vehicleKind";

interface VehicleKindIconProps {
  kind: VehicleKind;
  size?: number;
  className?: string;
}

const defaults = {
  xmlns: "http://www.w3.org/2000/svg",
  fill: "none",
  viewBox: "0 0 24 24",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function CarIcon({ size, className }: { size: number; className: string }) {
  return (
    <svg {...defaults} width={size} height={size} className={className}>
      <path d="M5 17h14M5 17a2 2 0 0 1-2-2v-3l2.2-5.4A2 2 0 0 1 7.1 6h9.8a2 2 0 0 1 1.9 1.3L21 12v3a2 2 0 0 1-2 2M5 17v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1" />
      <path d="M15 17v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1M7 12h10" />
      <circle cx="7.5" cy="17" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="16.5" cy="17" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function MotorcycleIcon({ size, className }: { size: number; className: string }) {
  return (
    <svg {...defaults} width={size} height={size} className={className}>
      <circle cx="6.5" cy="17" r="2" />
      <circle cx="17.5" cy="17" r="2" />
      <path d="M6.5 17h3l2.5-5 2 2.5h3.5" />
      <path d="M9.5 12 11 8h4l1.5 4" />
      <path d="M14 8h2.5l1 2" />
    </svg>
  );
}

function VanIcon({ size, className }: { size: number; className: string }) {
  return (
    <svg {...defaults} width={size} height={size} className={className}>
      <path d="M4 8h11v9H4z" />
      <path d="M15 11h3l2 3v3h-5z" />
      <path d="M4 17v1a1 1 0 0 0 1 1h1M19 18h1a1 1 0 0 0 1-1v-1" />
      <circle cx="7" cy="17" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="17" cy="17" r="1.5" fill="currentColor" stroke="none" />
      <path d="M7 12h5" />
    </svg>
  );
}

export function VehicleKindIcon({
  kind,
  size = 20,
  className = "",
}: VehicleKindIconProps) {
  if (kind === "motorcycle") {
    return <MotorcycleIcon size={size} className={className} />;
  }
  if (kind === "van") {
    return <VanIcon size={size} className={className} />;
  }
  return <CarIcon size={size} className={className} />;
}
