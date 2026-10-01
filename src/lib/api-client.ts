// src/lib/api-client.ts
// Browser-side fetch wrapper. Client-only (but no "use client" directive needed
// since it's a plain utility; just never import it in server components).

export interface ApiSuccessResult<T> {
  ok: true;
  data: T;
}

export interface ApiErrorResult {
  ok: false;
  error: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string[]>;
  };
}

export type ApiResult<T> = ApiSuccessResult<T> | ApiErrorResult;

/**
 * Typed fetch wrapper that never throws — always returns a discriminated result.
 * Network failures are converted to { ok: false, error: { code: "NETWORK_ERROR" } }.
 */
export async function apiRequest<T>(
  url: string,
  options?: RequestInit
): Promise<ApiResult<T>> {
  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });
  } catch {
    const isOffline = typeof navigator !== "undefined" && !navigator.onLine;
    return {
      ok: false,
      error: {
        code: "NETWORK_ERROR",
        message: isOffline
          ? "You appear to be offline."
          : "Network request failed. Please try again.",
      },
    };
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    return {
      ok: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Unexpected server response.",
      },
    };
  }

  if (!res.ok) {
    return {
      ok: false,
      error: ((json as { error?: unknown })?.error as ApiErrorResult["error"]) ?? {
        code: "UNKNOWN_ERROR",
        message: "An unexpected error occurred.",
      },
    };
  }

  return { ok: true, data: (json as { data: unknown }).data as T };
}

export function apiPost<T>(url: string, body: unknown): Promise<ApiResult<T>> {
  return apiRequest<T>(url, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function apiPatch<T>(url: string, body: unknown): Promise<ApiResult<T>> {
  return apiRequest<T>(url, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}
