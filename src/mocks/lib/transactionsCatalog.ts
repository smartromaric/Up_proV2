import transactionsSeed from "../data/transactions.json";
import type { Transaction, TransactionType } from "@/shared/types";
import type { ListQuery } from "./listQuery";
import { matchesSearch } from "./listQuery";

const TYPES: TransactionType[] = [
  "trip_payment",
  "commission",
  "withdrawal",
  "refund",
];

function buildCatalog(): Transaction[] {
  const seed = transactionsSeed.data as Transaction[];
  const rows: Transaction[] = [...seed];
  for (let i = 0; i < 80; i++) {
    const template = seed[i % seed.length];
    rows.push({
      ...template,
      id: `TX-${99000 - i}`,
      type: TYPES[i % TYPES.length],
      label: `${template.label} #${i}`,
      amount_fcfa: 1000 + (i % 50) * 1000,
      created_at: new Date(Date.now() - i * 7200000).toISOString(),
    });
  }
  return rows;
}

export const TRANSACTIONS_CATALOG = buildCatalog();

export function filterTransactions(rows: Transaction[], query: ListQuery): Transaction[] {
  let list = rows.filter((t) =>
    matchesSearch(query.search, t.id, t.label, t.entity_ref, t.franchise_name)
  );
  if (query.type) {
    list = list.filter((t) => t.type === query.type);
  }
  if (query.status) {
    list = list.filter((t) => t.status === query.status);
  }
  return list;
}
