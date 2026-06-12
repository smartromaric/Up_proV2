"use client";

import {
  coupledFranchiseRate,
  formatRatePercent,
  parseRatePercentInput,
  validatePoolSplit,
} from "@/shared/lib/commissionRateCoupling";

export type CommissionRatesCouplingMode = "partner-led" | "dual";

interface CommissionRuleRatesFormProps {
  pool: number;
  platformRate: number;
  driverRate: number;
  fiscalityRate: number;
  partnerRate: number;
  /** Obligatoire en mode `dual` ; ignoré en `partner-led` (calculé). */
  franchiseRate?: number;
  couplingMode?: CommissionRatesCouplingMode;
  onPartnerRateChange: (rate: number) => void;
  onFranchiseRateChange?: (rate: number) => void;
  disabled?: boolean;
}

export function CommissionRuleRatesForm({
  pool,
  platformRate,
  driverRate,
  fiscalityRate,
  partnerRate,
  franchiseRate: franchiseRateProp,
  couplingMode = "partner-led",
  onPartnerRateChange,
  onFranchiseRateChange,
  disabled = false,
}: CommissionRuleRatesFormProps) {
  const franchiseRate =
    couplingMode === "dual" && franchiseRateProp != null
      ? franchiseRateProp
      : coupledFranchiseRate(pool, partnerRate);

  const poolError = validatePoolSplit(pool, franchiseRate, partnerRate);
  const partnerPct = Math.round(partnerRate * 10_000);
  const poolPct = Math.round(pool * 10_000);
  const isDual = couplingMode === "dual";

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-canvas/50 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
          Autres parts (lecture seule)
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <RateDisplay label="Plateforme" value={platformRate} readonly />
          <RateDisplay label="Chauffeur" value={driverRate} readonly />
          <RateDisplay label="Fiscalité" value={fiscalityRate} readonly />
        </div>
        <p className="mt-3 text-xs text-muted">
          Ces taux ne sont pas modifiables ici. Seule la répartition franchise /
          partenaire est ajustable dans le pool ci-dessous.
        </p>
      </div>

      <div className="rounded-lg border border-teal/20 bg-teal/5 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium text-foreground">
            Répartition franchise / partenaire
          </p>
          <span className="rounded-full bg-surface px-2.5 py-0.5 text-xs font-medium text-teal-dark">
            Pool fixe : {formatRatePercent(pool)}
          </span>
        </div>

        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <RateDisplay
            label="Franchise"
            value={franchiseRate}
            readonly={!isDual}
            emphasized={!isDual}
          />
          <RateDisplay
            label="Partenaire"
            value={partnerRate}
            readonly={false}
            emphasized={isDual}
          />
        </div>

        <label className="block text-xs font-medium text-muted">
          Curseur partenaire — {formatRatePercent(partnerRate)}
          {!isDual && (
            <span className="font-normal text-muted">
              {" "}
              (franchise ajustée à {formatRatePercent(franchiseRate)})
            </span>
          )}
        </label>
        <input
          type="range"
          min={0}
          max={poolPct}
          step={1}
          value={partnerPct}
          disabled={disabled}
          className="mt-2 w-full accent-teal"
          onChange={(e) =>
            onPartnerRateChange(Number(e.target.value) / 10_000)
          }
        />

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
              Partenaire (%)
            </span>
            <input
              type="text"
              inputMode="decimal"
              disabled={disabled}
              className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm tabular-nums"
              value={(partnerRate * 100).toFixed(2)}
              onChange={(e) => {
                const parsed = parseRatePercentInput(e.target.value);
                if (parsed != null) onPartnerRateChange(parsed);
              }}
            />
          </label>

          {isDual && onFranchiseRateChange ? (
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                Franchise (%)
              </span>
              <input
                type="text"
                inputMode="decimal"
                disabled={disabled}
                className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm tabular-nums"
                value={(franchiseRate * 100).toFixed(2)}
                onChange={(e) => {
                  const parsed = parseRatePercentInput(e.target.value);
                  if (parsed != null) onFranchiseRateChange(parsed);
                }}
              />
            </label>
          ) : (
            <RateDisplay
              label="Franchise (calculé)"
              value={franchiseRate}
              readonly
              emphasized
            />
          )}
        </div>

        {poolError ? (
          <p className="mt-2 text-xs text-red-600">{poolError}</p>
        ) : (
          <p className="mt-2 text-xs text-muted">
            {isDual
              ? `Diminuer l'un des deux taux augmente automatiquement l'autre — la somme reste ${formatRatePercent(pool)}.`
              : `Augmenter le taux partenaire diminue le taux franchise — le pool reste à ${formatRatePercent(pool)}.`}
          </p>
        )}
      </div>

      <div className="rounded-lg border border-dashed border-border bg-canvas/30 px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
          Vue d&apos;ensemble des taux
        </p>
        <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-5">
          <RateSummaryItem label="Plateforme" value={platformRate} muted />
          <RateSummaryItem label="Franchise" value={franchiseRate} />
          <RateSummaryItem label="Partenaire" value={partnerRate} />
          <RateSummaryItem label="Chauffeur" value={driverRate} muted />
          <RateSummaryItem label="Fiscalité" value={fiscalityRate} muted />
        </dl>
      </div>
    </div>
  );
}

function RateDisplay({
  label,
  value,
  readonly = false,
  emphasized = false,
}: {
  label: string;
  value: number;
  readonly?: boolean;
  emphasized?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border px-3 py-2 ${
        emphasized
          ? "border-teal/30 bg-teal/5"
          : readonly
            ? "border-border bg-navy/[0.03] opacity-90"
            : "border-border bg-canvas"
      }`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
        {label}
        {readonly ? " · lecture seule" : ""}
      </p>
      <p
        className={`mt-1 text-sm font-semibold tabular-nums ${
          emphasized ? "text-teal-dark" : "text-foreground"
        }`}
      >
        {formatRatePercent(value)}
      </p>
    </div>
  );
}

function RateSummaryItem({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: number;
  muted?: boolean;
}) {
  return (
    <div className={muted ? "opacity-75" : undefined}>
      <dt className="text-[10px] text-muted">{label}</dt>
      <dd className="font-semibold tabular-nums text-foreground">
        {formatRatePercent(value)}
      </dd>
    </div>
  );
}
