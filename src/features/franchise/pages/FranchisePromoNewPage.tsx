"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import type { FranchisePromo } from "../api/promos.service";
import { useCreateFranchisePromo } from "../api/promos.queries";
import {
  FranchisePromoUserPicker,
  type PromoUserSelection,
} from "../components/FranchisePromoUserPicker";

export function FranchisePromoNewPage() {
  const router = useRouter();
  const create = useCreateFranchisePromo();
  const [values, setValues] = useState({
    code: "",
    label: "",
    discount_pct: 10,
    fixed_discount_fcfa: undefined as number | undefined,
    max_uses: 500,
    status: "draft" as FranchisePromo["status"],
    expires_at: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
  });
  const [useFixed, setUseFixed] = useState(false);
  const [audienceAll, setAudienceAll] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<PromoUserSelection[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const set = (patch: Partial<typeof values>) => setValues((v) => ({ ...v, ...patch }));

  return (
    <div className="animate-fade-up mx-auto w-full max-w-2xl">
      <PageHeader
        title="Nouveau code promo"
        breadcrumb={["Franchise", "Codes promo", "Nouveau"]}
      />

      <form
        className="space-y-4 rounded-card border border-border bg-surface p-6 shadow-card"
        onSubmit={(e) => {
          e.preventDefault();
          if (!audienceAll && selectedUsers.length === 0) {
            setFormError("Sélectionnez au moins un utilisateur pour un code ciblé.");
            return;
          }
          setFormError(null);
          create.mutate(
            {
              code: values.code,
              label: values.label,
              discount_pct: useFixed ? 0 : values.discount_pct,
              fixed_discount_fcfa: useFixed ? values.fixed_discount_fcfa : undefined,
              max_uses: values.max_uses,
              status: values.status,
              expires_at: new Date(values.expires_at).toISOString(),
              assigned_user_ids: audienceAll ? [] : selectedUsers.map((u) => u.id),
            },
            {
              onSuccess: (promo) => router.push(`/franchise/promos/${promo.id}`),
            }
          );
        }}
      >
        <label className="block">
          <span className="text-sm font-medium text-foreground">Code</span>
          <input
            required
            value={values.code}
            onChange={(e) => set({ code: e.target.value.toUpperCase() })}
            placeholder="CIWELCOME20"
            className="mt-1 w-full rounded-lg border border-border bg-canvas px-3 py-2.5 font-mono text-sm text-foreground outline-none ring-teal/30 focus:ring-2"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-foreground">Libellé</span>
          <input
            required
            value={values.label}
            onChange={(e) => set({ label: e.target.value })}
            placeholder="−20 % première course territoire"
            className="mt-1 w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-sm text-foreground outline-none ring-teal/30 focus:ring-2"
          />
        </label>

        <fieldset className="space-y-3 rounded-lg border border-border bg-canvas/50 p-4">
          <legend className="px-1 text-sm font-medium text-foreground">
            Utilisateurs concernés
          </legend>
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
              <input
                type="radio"
                name="audience"
                checked={audienceAll}
                onChange={() => {
                  setAudienceAll(true);
                  setFormError(null);
                }}
                className="border-border"
              />
              Tous les utilisateurs du territoire
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
              <input
                type="radio"
                name="audience"
                checked={!audienceAll}
                onChange={() => setAudienceAll(false)}
                className="border-border"
              />
              Utilisateurs sélectionnés
            </label>
          </div>
          {!audienceAll && (
            <FranchisePromoUserPicker
              value={selectedUsers}
              onChange={(users) => {
                setSelectedUsers(users);
                if (users.length > 0) setFormError(null);
              }}
            />
          )}
        </fieldset>

        <label className="flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={useFixed}
            onChange={(e) => setUseFixed(e.target.checked)}
            className="rounded border-border"
          />
          Montant fixe (FCFA) plutôt que pourcentage
        </label>
        {useFixed ? (
          <label className="block">
            <span className="text-sm font-medium text-foreground">Réduction fixe (FCFA)</span>
            <input
              type="number"
              min={1}
              required
              value={values.fixed_discount_fcfa ?? ""}
              onChange={(e) => set({ fixed_discount_fcfa: Number(e.target.value) })}
              className="mt-1 w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-sm text-foreground outline-none ring-teal/30 focus:ring-2"
            />
          </label>
        ) : (
          <label className="block">
            <span className="text-sm font-medium text-foreground">Réduction (%)</span>
            <input
              type="number"
              min={1}
              max={100}
              required
              value={values.discount_pct}
              onChange={(e) => set({ discount_pct: Number(e.target.value) })}
              className="mt-1 w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-sm text-foreground outline-none ring-teal/30 focus:ring-2"
            />
          </label>
        )}
        <label className="block">
          <span className="text-sm font-medium text-foreground">Utilisations max</span>
          <input
            type="number"
            min={1}
            required
            value={values.max_uses}
            onChange={(e) => set({ max_uses: Number(e.target.value) })}
            className="mt-1 w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-sm text-foreground outline-none ring-teal/30 focus:ring-2"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-foreground">Date d&apos;expiration</span>
          <input
            type="date"
            required
            value={values.expires_at}
            onChange={(e) => set({ expires_at: e.target.value })}
            className="mt-1 w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-sm text-foreground outline-none ring-teal/30 focus:ring-2"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-foreground">Statut à la création</span>
          <select
            value={values.status}
            onChange={(e) => set({ status: e.target.value as FranchisePromo["status"] })}
            className="mt-1 w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-sm text-foreground outline-none ring-teal/30 focus:ring-2"
          >
            <option value="draft">Brouillon</option>
            <option value="active">Actif</option>
          </select>
        </label>

        {formError && (
          <p className="text-sm text-red-600" role="alert">
            {formError}
          </p>
        )}

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Annuler
          </Button>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? "Création…" : "Créer le code"}
          </Button>
        </div>
      </form>
    </div>
  );
}
