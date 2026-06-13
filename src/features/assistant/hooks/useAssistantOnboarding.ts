"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { EMPTY_WIZARD_DOCUMENTS } from "@/features/fleet/components/fleet-pair-wizard/DocumentsStep";
import { processOnboardingFiles } from "../api/onboarding.service";
import {
  buildDocumentsFromAssignments,
  saveOnboardingBundle,
} from "../lib/onboardingFileStore";

export function useAssistantOnboarding() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSummary, setLastSummary] = useState<string[]>([]);
  const [missingDocsWarning, setMissingDocsWarning] = useState<string | null>(null);

  const processFiles = useCallback(
    async (files: File[], partnerQuery?: string) => {
      if (!files.length || isProcessing) return;

      setError(null);
      setMissingDocsWarning(null);
      setIsProcessing(true);
      setLastSummary([]);

      try {
        const result = await processOnboardingFiles(files, partnerQuery);
        setLastSummary(result.summary);

        if (result.missingDocuments?.length) {
          setMissingDocsWarning(
            `Documents manquants détectés : ${result.missingDocuments.join(", ")}. Vous pourrez les ajouter sur le formulaire.`
          );
        }

        const documents = buildDocumentsFromAssignments(
          {
            ...EMPTY_WIZARD_DOCUMENTS,
            cni: { ...EMPTY_WIZARD_DOCUMENTS.cni },
            license: { ...EMPTY_WIZARD_DOCUMENTS.license },
            registration: { ...EMPTY_WIZARD_DOCUMENTS.registration },
          },
          files,
          result.assignments
        );

        await saveOnboardingBundle({
          id: result.id,
          documents,
          merged: result.merged,
          partnerId: result.partnerId ?? undefined,
          summary: result.summary,
          createdAt: Date.now(),
        });

        const params = new URLSearchParams({ onboarding: result.id });
        const pid = result.partnerId;
        if (pid?.trim()) params.set("partnerId", pid.trim());

        router.push(`/admin/fleet/vehicles/new?${params.toString()}`);
        return result;
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : "Impossible de traiter les documents.";
        setError(msg);
        throw e;
      } finally {
        setIsProcessing(false);
      }
    },
    [isProcessing, router]
  );

  return { processFiles, isProcessing, error, lastSummary, missingDocsWarning };
}
