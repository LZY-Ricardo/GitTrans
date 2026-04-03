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
  let response: Response;

  try {
    response = await fetch(input, {
      ...init,
      headers: mergeHeaders(init),
    });
  } catch {
    throw new Error("网络请求失败，请检查服务是否可用后重试");
  }

  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!response.ok || !payload?.success) {
    if (response.status === 401) {
      throw new Error("登录已失效，请重新登录");
    }

    if (response.status === 403) {
      throw new Error(payload?.error?.message ?? "当前操作没有权限");
    }

    if (response.status === 409) {
      throw new Error(payload?.error?.message ?? "当前资源状态冲突，请刷新后重试");
    }

    if (response.status === 429) {
      throw new Error(payload?.error?.message ?? "请求过于频繁，请稍后再试");
    }

    throw new Error(payload?.error?.message ?? `请求失败 (${response.status})`);
  }

  return payload.data;
}
