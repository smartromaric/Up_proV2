import { adminPaths } from "@/core/routes/adminPaths";
import { formatFCFA } from "@/shared/lib/format";
import type { LiveMapActiveTrip, LiveMapDriver, LiveMapOrderMarker } from "@/shared/types";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function actionLinks(tripId: string, driverId?: string | number): string {
  const trip = `<a class="mapbox-live-popup__link" href="${adminPaths.trip(tripId)}">Voir la course</a>`;
  if (driverId == null) return trip;
  return `${trip}<a class="mapbox-live-popup__link" href="${adminPaths.driver(driverId)}">Voir le chauffeur</a>`;
}

export function buildDriverPopupHtml(driver: LiveMapDriver): string {
  const name = escapeHtml(driver.name);
  const meta = escapeHtml(
    [driver.vehicle, driver.partner_name].filter(Boolean).join(" · ")
  );

  if (driver.active_trip) {
    const t = driver.active_trip;
    const route = escapeHtml(`${t.from_label} → ${t.to_label}`);
    const status = escapeHtml(t.status_label);
    const ref = escapeHtml(t.ref);
    const amount =
      t.amount_fcfa != null
        ? `<p class="mapbox-live-popup__meta">${escapeHtml(formatFCFA(t.amount_fcfa))}</p>`
        : "";
    return `<div class="mapbox-live-popup__body">
      <p class="mapbox-live-popup__badge">En course</p>
      <strong>${name}</strong>
      ${meta ? `<p class="mapbox-live-popup__meta">${meta}</p>` : ""}
      <p class="mapbox-live-popup__trip">${ref} · ${status}</p>
      <p class="mapbox-live-popup__route">${route}</p>
      ${amount}
      <div class="mapbox-live-popup__actions">${actionLinks(t.id, driver.id)}</div>
    </div>`;
  }

  return `<div class="mapbox-live-popup__body">
    <strong>${name}</strong>
    ${meta ? `<p class="mapbox-live-popup__meta">${meta}</p>` : ""}
    <div class="mapbox-live-popup__actions">
      <a class="mapbox-live-popup__link" href="${adminPaths.driver(driver.id)}">Voir le chauffeur</a>
    </div>
  </div>`;
}

export function buildOrderMarkerPopupHtml(marker: LiveMapOrderMarker): string {
  const ref = escapeHtml(marker.ref);
  const kind = marker.kind === "pickup" ? "Prise en charge" : "Destination";
  const status = escapeHtml(marker.status_label);
  const place = escapeHtml(marker.label);
  const amount =
    marker.amount_fcfa != null
      ? `<p class="mapbox-live-popup__meta">${escapeHtml(formatFCFA(marker.amount_fcfa))}</p>`
      : "";

  return `<div class="mapbox-live-popup__body">
    <p class="mapbox-live-popup__badge">${escapeHtml(kind)}</p>
    <strong>${ref}</strong>
    <p class="mapbox-live-popup__meta">${status}</p>
    <p class="mapbox-live-popup__route">${place}</p>
    ${amount}
    <div class="mapbox-live-popup__actions">${actionLinks(marker.order_id, marker.driver_id)}</div>
  </div>`;
}
