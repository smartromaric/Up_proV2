"use client";

import { useEffect, useState } from "react";
import { isRemoteKycPreviewUrl } from "@/shared/lib/documentPreview";
const ZOOM_LEVELS = [1, 1.25, 1.5, 2] as const;

interface DocumentLightboxProps {
  open: boolean;
  onClose: () => void;
  title: string;
  src: string;
  isPdf?: boolean;
  subtitle?: string;
}

export function DocumentLightbox({
  open,
  onClose,
  title,
  src,
  isPdf = false,
  subtitle,
}: DocumentLightboxProps) {
  const [zoomIndex, setZoomIndex] = useState(0);

  useEffect(() => {
    if (!open) {
      setZoomIndex(0);
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const scale = ZOOM_LEVELS[zoomIndex];

  const toolbarBtn =
    "inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg border border-white/25 bg-white/15 text-base font-semibold text-white shadow-sm transition-colors hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black/80 backdrop-blur-md">
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-white/20 bg-zinc-950/90 px-4 py-3 text-white md:px-6">
        <div className="min-w-0">
          <p className="truncate font-medium text-white">{title}</p>
          {subtitle && (
            <p className="truncate text-xs text-zinc-300">{subtitle}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!isPdf && (
            <div className="flex items-center gap-1 rounded-lg border border-white/20 bg-black/30 px-1 py-0.5">
              <button
                type="button"
                disabled={zoomIndex === 0}
                onClick={() => setZoomIndex((i) => Math.max(0, i - 1))}
                className={toolbarBtn}
                aria-label="Zoom arrière"
              >
                −
              </button>
              <span className="min-w-[3.25rem] px-1 text-center text-sm font-medium tabular-nums text-white">
                {Math.round(scale * 100)} %
              </span>
              <button
                type="button"
                disabled={zoomIndex === ZOOM_LEVELS.length - 1}
                onClick={() =>
                  setZoomIndex((i) => Math.min(ZOOM_LEVELS.length - 1, i + 1))
                }
                className={toolbarBtn}
                aria-label="Zoom avant"
              >
                +
              </button>
            </div>
          )}
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg border border-white/25 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 shadow-sm transition-colors hover:bg-zinc-100"
            onClick={onClose}
          >
            Fermer
          </button>
        </div>
      </div>

      <button
        type="button"
        className="flex flex-1 items-center justify-center overflow-auto p-4 md:p-8"
        aria-label="Fermer l'aperçu"
        onClick={onClose}
      >
        <div
          className="max-h-full max-w-full"
          onClick={(e) => e.stopPropagation()}
          role="presentation"
        >
          {isPdf ? (
            <div className="flex max-w-lg flex-col items-center gap-4 rounded-card bg-surface p-8 text-center shadow-card">
              <svg
                className="h-16 w-16 text-red-500/80"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-sm text-muted">Document PDF</p>
              <a
                href={src}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-teal hover:underline"
              >
                Ouvrir dans un nouvel onglet
              </a>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={title}
                referrerPolicy="no-referrer"
                className="max-h-[calc(100vh-8rem)] rounded-lg shadow-2xl transition-transform duration-200"
                style={{
                  transform: `scale(${scale})`,
                  transformOrigin: "center center",
                }}
                draggable={false}
              />
              {isRemoteKycPreviewUrl(src) && (
                <a
                  href={src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-white/25 bg-white/15 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-white/25"
                  onClick={(e) => e.stopPropagation()}
                >
                  Ouvrir le fichier dans un nouvel onglet
                </a>
              )}
            </div>
          )}
        </div>
      </button>
    </div>
  );
}
