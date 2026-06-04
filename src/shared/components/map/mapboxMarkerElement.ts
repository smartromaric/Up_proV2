import type { MapboxPointFeature } from "./mapboxMarkers";

/** Icône navigation (public/) — pointe vers le haut à rotation 0°. */
export const LIVE_MAP_DRIVER_NAV_ICON = "/assets/icon/gps-navigation.png";

function driverNavIconHtml(): string {
  return `<span class="mapbox-live-marker__vehicle" aria-hidden="true">
    <img
      class="mapbox-live-marker__nav-icon"
      src="${LIVE_MAP_DRIVER_NAV_ICON}"
      width="32"
      height="32"
      alt=""
      decoding="async"
      draggable="false"
    />
  </span>`;
}

function waypointIconSvg(fill: string, label: string): string {
  return `<svg class="mapbox-live-marker__pin" viewBox="0 0 24 32" width="22" height="30" aria-hidden="true">
    <path fill="${fill}" stroke="#fff" stroke-width="1.2" d="M12 0C7.03 0 3 4.03 3 9c0 6.75 9 15 9 15s9-8.25 9-15c0-4.97-4.03-9-9-9z"/>
    <circle cx="12" cy="9" r="3.5" fill="#fff"/>
    <text x="12" y="10.5" text-anchor="middle" font-size="6" font-weight="700" fill="${fill}">${label}</text>
  </svg>`;
}

/** Crée le bouton marqueur (voiture chauffeur, épingle course). */
export function createLiveMapMarkerElement(feature: MapboxPointFeature): HTMLButtonElement {
  const el = document.createElement("button");
  el.type = "button";
  el.className = `mapbox-live-marker group mapbox-live-marker--${feature.kind}`;
  el.setAttribute("aria-label", feature.label);

  if (feature.kind === "driver") {
    const pulse = feature.pulse
      ? `<span class="mapbox-live-marker__ring mapbox-live-marker__ring--pulse" style="background:${feature.color}33"></span>`
      : "";
    el.innerHTML = `${pulse}${driverNavIconHtml()}`;
  } else {
    const letter = feature.kind === "pickup" ? "A" : "B";
    el.innerHTML = waypointIconSvg(feature.color, letter);
  }

  return el;
}
