/**
 * Funnel State Utility
 * Persists lead identity and progress across all funnel pages using
 * sessionStorage as the primary store, with URL query params as the
 * secondary transport mechanism between page navigations.
 */

const STORAGE_KEY = "vsf_lead";

export interface FunnelState {
  email: string;
  name?: string;
  source?: string;
  qualified?: boolean;
  booked?: boolean;
}

/** Read the current funnel state from sessionStorage */
export function getFunnelState(): FunnelState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as FunnelState;
  } catch {
    return null;
  }
}

/** Persist funnel state to sessionStorage */
export function setFunnelState(state: FunnelState): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // sessionStorage may be unavailable in some private modes
  }
}

/** Merge partial updates into the existing funnel state */
export function updateFunnelState(updates: Partial<FunnelState>): FunnelState {
  const current = getFunnelState() ?? { email: "" };
  const next = { ...current, ...updates };
  setFunnelState(next);
  return next;
}

/** Clear the funnel state (e.g. after booking confirmation) */
export function clearFunnelState(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Build a navigation URL with the lead email embedded as a query param.
 * This ensures the email survives hard navigations (e.g. external redirects).
 */
export function funnelUrl(path: string, extra?: Record<string, string>): string {
  const state = getFunnelState();
  const params = new URLSearchParams();
  if (state?.email) params.set("email", state.email);
  if (state?.name) params.set("name", state.name);
  if (extra) {
    Object.entries(extra).forEach(([k, v]) => params.set(k, v));
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

/**
 * On page load, attempt to hydrate funnel state from URL params.
 * Call this at the top of each funnel page component.
 */
export function hydrateFromUrl(): FunnelState | null {
  const params = new URLSearchParams(window.location.search);
  const email = params.get("email");
  const name = params.get("name") ?? undefined;

  if (email) {
    const existing = getFunnelState();
    const merged: FunnelState = { ...existing, email, name: name ?? existing?.name };
    setFunnelState(merged);
    return merged;
  }

  return getFunnelState();
}
