export async function probeRTT(
  endpoint = "/api/ping",
  signal = null,
  timeoutMs = 3000
) {
  const url = endpoint + "?t=" + crypto.randomUUID();
  const start = performance.now();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      cache: "no-store",
      keepalive: false,
      signal: signal ? signal : controller.signal
    });

    const ttfb = performance.now() - start;

    return {
      ttfb,
      status: response.status,
      ok: response.ok,
      error_type: null
    };

  } catch (err) {
    clearTimeout(timeout);
    const ttfb = performance.now() - start;

    let error_type = "fetch_error";

    if (err.name === "AbortError") {
      error_type = signal?.aborted ? "abort" : "timeout";
    } else if (err.message?.includes("net::ERR_NAME_NOT_RESOLVED") ||
               err.message?.includes("DNS")) {
      error_type = "dns_fail";
    } else if (err.message?.includes("net::ERR_CONNECTION_REFUSED")) {
      error_type = "connection_refused";
    } else if (err.message?.includes("Failed to fetch") ||
               err.message?.includes("NetworkError") ||
               err.message?.includes("CORS")) {
      error_type = "network_error";
    }

    return {
      ttfb: null,
      status: null,
      ok: false,
      error_type
    };

  } finally {
    clearTimeout(timeout);
  }
}