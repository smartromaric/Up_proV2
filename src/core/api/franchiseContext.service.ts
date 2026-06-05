import { apiClient } from "@/core/http/apiClient";
import { ApiError, AppError } from "@/core/http/errorHandler";
import { useAuthStore } from "@/core/auth/authStore";
import { LINKS } from "@/core/api/links";

interface FranchisesMeResponse {
  status?: string;
  franchise?: { id: string; name?: string | null } | null;
}

let cachedFranchiseId: string | null = null;

export function clearFranchiseContextCache(): void {
  cachedFranchiseId = null;
}

/** ID franchise du portail — session, puis GET /v1/franchises/me */
export async function resolveFranchiseId(): Promise<string> {
  if (cachedFranchiseId) return cachedFranchiseId;

  const user = useAuthStore.getState().user;
  if (user?.franchise_id != null && String(user.franchise_id).trim()) {
    cachedFranchiseId = String(user.franchise_id);
    return cachedFranchiseId;
  }

  try {
    const me = await apiClient.get<FranchisesMeResponse>(LINKS.franchise.v1.me);
    const id = me.franchise?.id;
    if (id) {
      cachedFranchiseId = id;
      return id;
    }
  } catch (error) {
    if (!(error instanceof ApiError && error.status === 404)) {
      throw error;
    }
  }

  throw new AppError(
    "Impossible de déterminer la franchise connectée.",
    "FRANCHISE_CONTEXT_MISSING",
    403
  );
}
