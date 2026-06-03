import type { TripMatchingDriver, TripTimelineEvent } from "@/shared/types";
import type { TimelineItem } from "@/shared/ui/Timeline";

export function tripTimelineVariant(
  type: TripTimelineEvent["type"]
): TimelineItem["variant"] {
  if (type === "completed" || type === "in_progress") return "success";
  if (type === "cancelled") return "muted";
  if (type === "matching" || type === "requested") return "warning";
  return "default";
}

export function tripTimelineToItems(
  events: TripTimelineEvent[],
  options?: { driverLinkBase?: string }
): TimelineItem[] {
  const base = options?.driverLinkBase ?? "/admin/fleet/drivers";
  return events.map((e) => ({
    id: e.id,
    label: e.label,
    description: e.matching_drivers?.length ? undefined : e.description,
    at: e.at,
    variant: tripTimelineVariant(e.type),
    matching_drivers: e.matching_drivers?.map((d) => ({
      ...d,
      href: `${base}/${d.driver_id}`,
    })),
  }));
}

export type TimelineMatchingDriver = TripMatchingDriver & { href: string };
