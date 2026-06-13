import type { MergedExtraction } from "@/features/fleet/lib/documentExtraction.types";
import type { WizardDocumentsState } from "@/features/fleet/components/fleet-pair-wizard/DocumentsStep";

const DB_NAME = "upjunoo-assistant-onboarding";
const STORE = "bundles";
const DB_VERSION = 1;

export interface OnboardingBundle {
  id: string;
  documents: WizardDocumentsState;
  merged: MergedExtraction;
  partnerId?: string;
  summary: string[];
  createdAt: number;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB indisponible"));
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
  });
}

export async function saveOnboardingBundle(bundle: OnboardingBundle): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => reject(tx.error ?? new Error("Échec enregistrement onboarding"));
    tx.objectStore(STORE).put(bundle);
  });
}

export async function loadOnboardingBundle(id: string): Promise<OnboardingBundle | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const request = tx.objectStore(STORE).get(id);
    request.onsuccess = () => {
      db.close();
      resolve((request.result as OnboardingBundle | undefined) ?? null);
    };
    request.onerror = () => reject(request.error ?? new Error("Lecture onboarding impossible"));
  });
}

export async function clearOnboardingBundle(id: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => reject(tx.error ?? new Error("Suppression onboarding impossible"));
    tx.objectStore(STORE).delete(id);
  });
}

function setNestedFile(
  documents: WizardDocumentsState,
  slot: string,
  file: File
): WizardDocumentsState {
  const next = { ...documents };
  if (slot === "selfie") return { ...next, selfie: file };
  if (slot === "insurance") return { ...next, insurance: file };
  if (slot === "technicalInspection") return { ...next, technicalInspection: file };

  const [group, side] = slot.split(".");
  if (group === "cni" || group === "license" || group === "registration") {
    const rv = { ...next[group] };
    if (side === "verso") rv.verso = file;
    else rv.recto = file;
    return { ...next, [group]: rv };
  }
  return next;
}

export function buildDocumentsFromAssignments(
  base: WizardDocumentsState,
  files: File[],
  assignments: Array<{ fileIndex: number; slot: string }>
): WizardDocumentsState {
  let documents = base;
  for (const a of assignments) {
    const file = files[a.fileIndex];
    if (file) documents = setNestedFile(documents, a.slot, file);
  }
  return documents;
}
