"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/Button";
import { formatFCFA } from "@/shared/lib/format";
import { useFranchisePartnersList } from "../api/partners.queries";
import { useFranchisePartnerRecharge } from "../api/finance.queries";

interface FranchisePartnerRechargeModalProps {
  open: boolean;
  availableFcfa: number;
  onClose: () => void;
}

export function FranchisePartnerRechargeModal({
  open,
  availableFcfa,
  onClose,
}: FranchisePartnerRechargeModalProps) {
  const [partnerId, setPartnerId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const { data: partnersData, isLoading } = useFranchisePartnersList({
    page: 1,
    per_page: 50,
  });
  const recharge = useFranchisePartnerRecharge();

  if (!open) return null;

  const partners = partnersData?.data ?? [];
  const parsedAmount = Number(amount.replace(/\s/g, ""));
  const parsedPartnerId = Number(partnerId);
  const valid =
    parsedPartnerId > 0 &&
    parsedAmount >= 5000 &&
    parsedAmount <= availableFcfa;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-overlay"
        aria-label="Fermer"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal
        className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-card bg-surface p-6 shadow-card"
      >
        <h2 className="text-lg font-semibold text-heading">
          Recharger un partenaire
        </h2>
        <p className="mt-1 text-sm text-muted">
          Crédit sur le portefeuille opérationnel du partenaire. Disponible :{" "}
          {formatFCFA(availableFcfa)}
        </p>

        <label className="mt-4 block">
          <span className="text-sm font-medium">Partenaire</span>
          <select
            value={partnerId}
            onChange={(e) => setPartnerId(e.target.value)}
            disabled={isLoading}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
          >
            <option value="">Sélectionner…</option>
            {partners.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.city}
              </option>
            ))}
          </select>
        </label>

        <label className="mt-4 block">
          <span className="text-sm font-medium">Montant (FCFA)</span>
          <input
            type="number"
            min={5000}
            step={1000}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
          />
        </label>

        <label className="mt-4 block">
          <span className="text-sm font-medium">Note (optionnel)</span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
          />
        </label>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button
            type="button"
            disabled={!valid || recharge.isPending}
            onClick={() => {
              recharge.mutate(
                {
                  partner_id: parsedPartnerId,
                  amount_fcfa: parsedAmount,
                  note: note.trim() || undefined,
                },
                { onSuccess: () => onClose() }
              );
            }}
          >
            {recharge.isPending ? "Transfert…" : "Créditer le partenaire"}
          </Button>
        </div>
      </div>
    </div>
  );
}
