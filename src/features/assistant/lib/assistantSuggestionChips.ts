import type { AssistantPageContext } from "@/features/assistant/types";

export interface SuggestionChip {
  label: string;
  prompt: string;
}

export function buildContextualSuggestions(
  context: AssistantPageContext
): SuggestionChip[] {
  const chips: SuggestionChip[] = [];

  if (context.entity === "drivers" && context.entityId) {
    chips.push(
      { label: "Résumé", prompt: "Résume cette fiche" },
      { label: "Peut rouler ?", prompt: "Peut-il rouler ?" },
      { label: "Pièces KYC", prompt: "Quelles pièces KYC manquent ?" },
      { label: "Son véhicule", prompt: "Son véhicule" },
      { label: "Wallet", prompt: "Solde wallet chauffeur" },
      { label: "Position", prompt: "Où est ce chauffeur ?" },
      { label: "Dossier complet", prompt: "Traiter le dossier chauffeur" }
    );
  } else if (context.entity === "partners" && context.entityId) {
    chips.push(
      { label: "Résumé", prompt: "Résume cette fiche" },
      { label: "CA", prompt: "Chiffre d'affaires de ce partenaire" },
      { label: "Wallet", prompt: "Solde wallet partenaire" },
      { label: "Chauffeurs", prompt: "Liste des chauffeurs de ce partenaire" }
    );
  } else if (context.entity === "vehicles" && context.entityId) {
    chips.push(
      { label: "Résumé", prompt: "Résume cette fiche" },
      { label: "Peut rouler ?", prompt: "Ce véhicule peut-il rouler ?" },
      { label: "Chauffeur", prompt: "Son chauffeur" }
    );
  } else if (context.isListPage && context.entity === "drivers") {
    chips.push(
      { label: "Premier", prompt: "Ouvre le premier chauffeur" },
      { label: "KYC attente", prompt: "Chauffeurs KYC en attente" },
      { label: "En ligne", prompt: "Chauffeurs en ligne" },
      { label: "Suspendus", prompt: "Chauffeurs suspendus" }
    );
  } else if (context.isListPage && context.entity === "kyc") {
    chips.push(
      { label: "File KYC", prompt: "Documents KYC en attente" },
      { label: "Comptes attente", prompt: "Comptes chauffeurs en attente" }
    );
  } else {
    chips.push(
      { label: "KYC attente", prompt: "KYC en attente" },
      { label: "En ligne", prompt: "Chauffeurs en ligne" },
      { label: "Ops live", prompt: "Combien de chauffeurs en ligne ?" },
      { label: "Top partenaires", prompt: "Quel partenaire est le plus performant ?" },
      { label: "Litiges", prompt: "Litiges ouverts" },
      { label: "Courses", prompt: "Courses en cours" }
    );
  }

  return chips.slice(0, 6);
}
