/**
 * In some environments (corporate networks, China ISP restrictions), Node's
 * built-in `fetch`/Octokit calls to external services can fail unless traffic
 * is routed through an HTTP proxy.
 *
 * We intentionally avoid a top-level `undici` import here. In Next.js dev
 * mode, statically importing `undici` from server modules can produce brittle
 * vendor-chunk references and break unrelated pages during SSR.
 */

const DEFAULT_CONNECT_TIMEOUT_MS = 30_000;

type FetchInitWithDispatcher = Parameters<typeof fetch>[1] & {
  dispatcher?: unknown;
};

let dispatcherPromise: Promise<unknown | undefined> | null = null;

function getConnectTimeoutMs() {
  const raw = process.env.HTTP_CONNECT_TIMEOUT_MS ?? process.env.http_connect_timeout_ms;
  const parsed = raw ? Number(raw) : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_CONNECT_TIMEOUT_MS;
}

function shouldUseProxyDispatcher() {
  return Boolean(
    process.env.HTTPS_PROXY ??
      process.env.HTTP_PROXY ??
      process.env.https_proxy ??
      process.env.http_proxy,
  );
}

async function getDispatcher() {
  if (!shouldUseProxyDispatcher()) {
    return undefined;
  }

  if (!dispatcherPromise) {
    dispatcherPromise = Promise.resolve().then(() => {
      // Runtime require prevents webpack from hardwiring `undici` into page SSR bundles.
      const runtimeRequire = (0, eval)("require") as NodeRequire;
      const { EnvHttpProxyAgent } = runtimeRequire("undici") as {
        EnvHttpProxyAgent: new (options: { connectTimeout: number }) => unknown;
      };

      return new EnvHttpProxyAgent({
        connectTimeout: getConnectTimeoutMs(),
      });
    });
  }

  return dispatcherPromise;
}

export async function outboundFetch(
  input: Parameters<typeof fetch>[0],
  init?: FetchInitWithDispatcher,
) {
  const dispatcher = await getDispatcher();

  return fetch(input, {
    ...init,
    ...(dispatcher ? { dispatcher } : {}),
  } as FetchInitWithDispatcher);
}

/**
 * Octokit expects a `fetch(url, options)` function.
 * We reuse the same dispatcher logic so Octokit can work behind proxies.
 */
export const octokitFetch = async (url: string, options: Record<string, unknown>) =>
  outboundFetch(url, options as FetchInitWithDispatcher);
