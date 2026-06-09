"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * La création chauffeur seule n'est plus autorisée — redirection vers le formulaire couplé.
 */
export function PartnerDriverCreatePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/partner/fleet/new");
  }, [router]);

  return (
    <p className="p-8 text-sm text-muted">
      Redirection vers la création chauffeur + véhicule…
    </p>
  );
}
