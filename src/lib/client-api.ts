"use client";

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  error: {
    code: string;
    message: string;
  } | null;
  requestId: string;
};

function mergeHeaders(init?: RequestInit) {
  const headers = new Headers(init?.headers);

  if (!headers.has("Content-Type") && init?.body) {
    headers.set("Content-Type", "application/json");
  }

  return headers;
}

export async function requestApi<T>(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, {
    ...init,
    headers: mergeHeaders(init),
  });

  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.error?.message ?? `请求失败 (${response.status})`);
  }

  return payload.data;
}
