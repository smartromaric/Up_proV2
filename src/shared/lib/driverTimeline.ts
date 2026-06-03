import type { DriverTimelineEvent } from "@/shared/types";
import type { TimelineItem } from "@/shared/ui/Timeline";

export function driverTimelineVariant(
  type: DriverTimelineEvent["type"]
): TimelineItem["variant"] {
  switch (type) {
    case "approved":
    case "trip_offer_accepted":
      return "success";
    case "kyc":
      return "warning";
    case "trip_offer_declined":
      return "muted";
    case "suspended":
      return "muted";
    default:
      return "default";
  }
}

export function driverTimelineToItems(
  events: DriverTimelineEvent[],
  options?: { tripLinkBase?: string }
): TimelineItem[] {
  const tripBase = options?.tripLinkBase ?? "/admin/ops/trips";
  return events.map((e) => ({
    id: e.id,
    label: e.label,
    description: e.trip_ref ? undefined : e.description,
    at: e.at,
    variant: driverTimelineVariant(e.type),
    trip_link:
      e.trip_id && e.trip_ref
        ? {
            id: e.trip_id,
            ref: e.trip_ref,
            href: `${tripBase}/${e.trip_id}`,
            subtitle: e.description,
          }
        : undefined,
  }));
}
