"use client";

import Link from "next/link";

const LINKS = [
  { href: "/admin/finance/transactions", label: "Transactions" },
  { href: "/admin/finance/withdrawals", label: "Retraits" },
  { href: "/admin/finance/wallets", label: "Portefeuilles" },
  { href: "/admin/finance/commissions", label: "Commissions" },
  { href: "/admin/finance/reconciliation", label: "Réconciliation" },
  { href: "/admin/finance/driver-transfers", label: "Recharges chauffeurs" },
] as const;

export function FinanceQuickLinks() {
  return (
    <div className="flex flex-wrap gap-2">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground transition-colors hover:border-teal/40 hover:text-teal"
        >
          {link.label} →
        </Link>
      ))}
    </div>
  );
}
