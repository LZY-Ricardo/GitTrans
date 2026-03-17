import { EnvHttpProxyAgent, fetch as undiciFetch } from "undici";

/**
 * In some environments (corporate networks, China ISP restrictions), Node's
 * built-in `fetch`/Octokit calls to `github.com:443` can fail unless we route
 * traffic through an HTTP proxy.
 *
 * Octokit does not automatically respect `HTTP_PROXY`/`HTTPS_PROXY`, so we
 * provide a custom fetch that uses Undici's EnvHttpProxyAgent.
 *
 * Configure via env:
 * - HTTPS_PROXY / HTTP_PROXY (and optional NO_PROXY)
 * - HTTP_CONNECT_TIMEOUT_MS (optional, default 30000)
 */

const DEFAULT_CONNECT_TIMEOUT_MS = 30_000;

function getConnectTimeoutMs() {
  const raw = process.env.HTTP_CONNECT_TIMEOUT_MS ?? process.env.http_connect_timeout_ms;
  const parsed = raw ? Number(raw) : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_CONNECT_TIMEOUT_MS;
}

// Single dispatcher instance for the whole process.
const dispatcher = new EnvHttpProxyAgent({
  connectTimeout: getConnectTimeoutMs(),
});

export function outboundFetch(input: Parameters<typeof undiciFetch>[0], init?: Parameters<typeof undiciFetch>[1]) {
  return undiciFetch(input, {
    ...init,
    dispatcher,
  });
}

/**
 * Octokit expects a `fetch(url, options)` function.
 * We reuse the same dispatcher so Octokit can work behind proxies.
 */
export const octokitFetch: (url: string, options: Record<string, unknown>) => ReturnType<typeof undiciFetch> = (
  url,
  options,
) =>
  undiciFetch(url, {
    ...(options as Parameters<typeof undiciFetch>[1]),
    dispatcher,
  });

