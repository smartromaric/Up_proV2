"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { useLegacyAdminApi } from "@/core/api/v1AdminMode";
import type { Franchise } from "@/shared/types";
import { useCreateFranchise, useFranchisesList } from "../api/franchises.queries";

export function FranchiseCreatePage() {
  const router = useRouter();
  const legacy = useLegacyAdminApi();
  const create = useCreateFranchise();
  const { data: franchisesList } = useFranchisesList({ page: 1, per_page: 100 });
  const [name, setName] = useState("");
  const [city, setCity] = useState("Abidjan");
  const [franchiseId, setFranchiseId] = useState("");
  const [status, setStatus] = useState<Franchise["status"]>("pending");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminPasswordConfirm, setAdminPasswordConfirm] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  const submit = () => {
    const next: string[] = [];
    if (!name.trim()) next.push("Le nom est requis.");
    if (!city.trim()) next.push("La ville est requise.");
    if (!legacy && !franchiseId.trim()) {
      next.push(
        "Contournement temporaire : sélectionnez une franchise seed (l'API devrait accepter la création sans franchiseId)."
      );
    }
    if (!contactEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      next.push("Un email de contact valide est requis.");
    }
    if (adminPassword.length < 8) {
      next.push("Le mot de passe admin doit contenir au moins 8 caractères.");
    }
    if (adminPassword !== adminPasswordConfirm) {
      next.push("Les mots de passe ne correspondent pas.");
    }
    setErrors(next);
    if (next.length) return;

    create.mutate(
      {
        name: name.trim(),
        city: city.trim(),
        status,
        contact_email: contactEmail.trim(),
        contact_phone: contactPhone.trim(),
        admin_password: adminPassword,
        franchise_id: franchiseId.trim() || undefined,
      },
      {
        onSuccess: (data) => {
          router.push(`/admin/network/franchises/${data.id}`);
        },
      }
    );
  };

  return (
    <div className="animate-fade-up mx-auto w-full max-w-3xl px-4 pb-10">
      <PageHeader title="Nouvelle franchise" breadcrumb={["Admin", "Réseau", "Franchises"]} />
      <p className="mb-6 text-sm">
        <Link href="/admin/network/franchises" className="text-teal hover:underline">
          ← Retour
        </Link>
      </p>

      {!legacy && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-medium">Limitation API — création franchise (FR-CREATE-01)</p>
          <p className="mt-1 text-amber-800">
            La création d&apos;une <strong>nouvelle</strong> franchise ne doit pas exiger un{" "}
            <code className="text-xs">franchiseId</code> existant. Aujourd&apos;hui{" "}
            <code className="text-xs">POST /v1/auth/franchise/register</code> renvoie{" "}
            <code className="text-xs">AUTH_FRANCHISE_ID_REQUIRED</code> sans UUID — comportement
            backend à corriger. Contournement temporaire : sélectionner une franchise seed.
            Voir <code className="text-xs">docs/DEMANDES-2026-06-08.md</code>.
          </p>
        </div>
      )}

      {errors.length > 0 && (
        <ul className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}

      <form
        className="space-y-4 rounded-card border border-border bg-surface p-6 shadow-card"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        {!legacy && (
          <label className="block">
            <span className="text-sm font-medium">Franchise cible</span>
            <select
              value={franchiseId}
              onChange={(e) => setFranchiseId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
              required
            >
              <option value="">— Choisir une franchise —</option>
              {(franchisesList?.data ?? []).map((f) => (
                <option key={String(f.id)} value={String(f.id)}>
                  {f.name} · {f.city}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted">
              Workaround temporaire — la création ne devrait pas exiger un UUID existant (demande
              FR-CREATE-01).
            </p>
          </label>
        )}
        <label className="block">
          <span className="text-sm font-medium">
            {legacy ? "Pays ou région" : "Nom affiché (contact admin)"}
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={
              legacy
                ? "Ex. Côte d'Ivoire, Canada, Espace euro"
                : "Ex. Admin · UPJUNOO Côte d'Ivoire"
            }
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
            required
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Siège (ville principale)</span>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Ex. Abidjan, Montréal, Paris"
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
            required
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Email contact</span>
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
            required
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Téléphone</span>
          <input
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder="+225 …"
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
          />
        </label>
        <fieldset className="space-y-4 rounded-lg border border-border bg-canvas/50 p-4">
          <legend className="px-1 text-sm font-semibold text-foreground">
            Accès portail franchise
          </legend>
          <p className="text-xs text-muted">
            L&apos;email de contact servira d&apos;identifiant de connexion portail franchise.
            {legacy
              ? " Le mot de passe est transmis une seule fois à la création (mock)."
              : " Route API : POST /v1/auth/franchise/register."}
          </p>
          <label className="block">
            <span className="text-sm font-medium">Mot de passe admin</span>
            <input
              type="password"
              autoComplete="new-password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              minLength={8}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
              required
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Confirmer le mot de passe</span>
            <input
              type="password"
              autoComplete="new-password"
              value={adminPasswordConfirm}
              onChange={(e) => setAdminPasswordConfirm(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
              required
            />
          </label>
        </fieldset>
        <label className="block">
          <span className="text-sm font-medium">Statut initial</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as Franchise["status"])}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
          >
            <option value="pending">En attente</option>
            <option value="active">Actif</option>
          </select>
        </label>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Annuler
          </Button>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending
              ? "Création…"
              : legacy
                ? "Créer la franchise"
                : "Créer l'accès portail"}
          </Button>
        </div>
      </form>
    </div>
  );
}
