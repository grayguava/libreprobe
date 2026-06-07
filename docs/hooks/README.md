# Libreprobe — Hook Contract

This document defines the public contract for embedding Libreprobe into your own HTML. If you wire up the required DOM elements and call the documented init functions, Libreprobe will populate them. Styling is yours to provide.

## Mental model

Libreprobe is split into **two systems**:

- **Info** — passive infrastructure introspection. The browser fetches `/api/info` (a Cloudflare Worker) which returns the client's IP, ASN, TLS version, edge location, and GeoIP. The page renders this once.
- **Stability** — active client-side measurement. The browser issues N probes against a configured endpoint and produces a per-route RTT profile (median, p90, variance, reliability, scores, verdict).

The Info system can be swapped out or omitted entirely. The Stability system works against any endpoint and is not tied to Cloudflare.

## Layers

| Layer       | Files                                                                  | What you import                          |
|-------------|------------------------------------------------------------------------|------------------------------------------|
| Apps        | `src/apps/connectionInfoRenderer.js`, `src/apps/getStability.js`       | Side-effect on `DOMContentLoaded`        |
| UI          | `src/ui/navigation.js`, `src/ui/providerPicker.js`                     | `populateProviders`, `getSelectedProvider`, `disablePicker`, `enablePicker` from picker |
| Measurement | `src/measurement/environment/getConnectionInfo.js`                     | `getConnectionInfo()`                    |
| Measurement | `src/measurement/rtt/{probe,handshake,stability,interpret}.js`          | Low-level — usually imported by apps     |
| Data        | `data/cloudflare-edge-locations.json`, `data/providers.json`           | Fetched at runtime, not imported         |
| Workers     | `workers/api/info/index.js`, `workers/api/ping/index.js`               | Cloudflare Pages Functions               |

## Pages

Libreprobe ships three reference pages with hooks:

- [`home.md`](./home.md) — landing page (no measurement, hero + CTA)
- [`info.md`](./info.md) — `/api/info` consumer, renders map, ASN, edge
- [`stability.md`](./stability.md) — runs the test, shows live chart and verdict

## Conventions

- IDs are **kebab-case** and prefixed by their system (`hero-*`, `val-*`, `score-*`, `kv-*`).
- A missing required element is logged and skipped — the app degrades gracefully.
- An optional element missing means the feature that uses it is hidden.
- Modules are ES modules (`<script type="module">`).
- The Info app is HTML-agnostic about layout. Bind elements, render, done.
- The Stability app owns the run button, picker, charts, and verdict DOM.

## Vendored libraries

- Leaflet (map) — see `vendor/leaflet/`
- ECharts (live + distribution charts) — see `vendor/echarts/`

Load these yourself before importing the apps that use them. The map renderer expects `window.L`; the chart renderer expects `window.echarts`.

## Public measurement API

The apps in `src/apps/` cover the common cases. If you want to build your own UI on top of the engine, the following modules are also exported and stable:

### `src/measurement/environment/getConnectionInfo.js`

```js
import { getConnectionInfo } from "../src/measurement/environment/getConnectionInfo.js";

const info = await getConnectionInfo("/api/info");
// info = { client, network, protocol, edge, error? }
```

Fetches the Info worker, joins the result with `data/cloudflare-edge-locations.json`, and returns a normalised object. The `error` field is `true` on failure (network error, non-2xx, missing fields). Default endpoint: `/api/info`.

### `src/measurement/rtt/probe.js`

```js
import { probeRTT } from "../src/measurement/rtt/probe.js";

const r = await probeRTT("/api/ping", null, 3000);
// r = { ttfb, status, ok, error_type }
//   ttfb: number | null  — TTFB in ms, null on failure
//   status: number | null — HTTP status, null on failure
//   ok: boolean
//   error_type: "timeout" | "abort" | "dns_fail" | "connection_refused" | "network_error" | "fetch_error" | null
```

Single probe against an endpoint. `signal` is an optional `AbortSignal`; `timeoutMs` defaults to 3000.

### `src/measurement/rtt/handshake.js`

```js
import { measureHandshake } from "../src/measurement/rtt/handshake.js";

const hs = await measureHandshake("/api/ping");
// hs = { cold, warm, coldSuccess, warmSuccess, coldStatus, warmStatus }
//   cold: number | null
//   warm: number | null
//   coldSuccess: boolean
//   warmSuccess: boolean
//   coldStatus: number | null
//   warmStatus: number | null
```

Issues 1 cold probe + 6 warmup probes + 1 warm probe against the endpoint. Use the cold/warm delta to estimate connection setup overhead (DNS + TCP + TLS).

### `src/measurement/rtt/stability.js`

```js
import { measureRTT } from "../src/measurement/rtt/stability.js";

const r = await measureRTT({
  endpoint: "/api/ping",      // required
  intervalMs: 100,             // gap between probes
  timeoutMs: 3000,             // per-probe timeout
  onSample: ({ ttfb, error_type }) => { /* live stream */ }
});
// r = {
//   samples, attempts, errors,          // counts
//   median, p90, min, max,              // percentiles
//   latency_variance,                   // std-dev
//   jitter_median, jitter_p95,          // inter-sample deltas
//   loss,                               // (attempts - samples) / attempts
//   effective_cadence,                  // observed interval in ms
//   samples, intervalMs, durationMs,    // metadata
//   raw_ttfb,                           // valid TTFBs only
//   raw_chronological                   // [{ t, ttfb, error_type }, ...]
// }
```

Runs 100 probes at the requested cadence. `onSample` fires after every probe with `{ ttfb, error_type }` (ttfb is null on failure). Use it to drive a live chart.

### `src/measurement/rtt/interpret.js`

```js
import { interpret } from "../src/measurement/rtt/interpret.js";

const out = interpret({
  info:      { /* getConnectionInfo() result */ },
  handshake: { /* measureHandshake() result */ },
  latency:   { /* measureRTT() result */ },
  provider:  { name, baselineProfile }
});
// out = {
//   verdict:  { level, headline, consequence, usecases },
//   findings: [{ severity, headline, detail, tip? }],
//   scores:   { latency, stability, reliability },
//   profile:  { /* the baseline profile used */ }
// }
//   levels:  "great" | "ok" | "slow" | "unstable" | "bad"
//   scores:  "excellent" | "good" | "moderate" | "poor" | "critical" | "unknown"
```

Combines the three measurement outputs into a per-route verdict. The `baselineProfile.rttBands` (from `providers.json`) override the default latency thresholds. Without a profile, the global defaults are used.

### `src/measurement/rtt/sampler.js`

```js
import { Sampler, sleep } from "../src/measurement/rtt/sampler.js";

await sleep(50);

const sampler = new Sampler(100); // target interval in ms
const results = await sampler.run(async () => {
  // your probe here
  return { ttfb: 42 };
}, 100);
// results = [{ t: msOffset, v: probeReturnValue }, ...]
```

Internal utility for paced sampling. The Stability runner uses this to keep probes at a steady cadence. `sleep(ms)` is a promise-based delay.

## Required deployments

- `/api/info` — must return JSON matching `workers/api/info/index.js`.
- `/api/ping` — must return `204 No Content` with `Cache-Control: no-store`.
- `/assets/data/cloudflare-edge-locations.json` — keyed by IATA colo code.
- `/assets/data/providers.json` — array of provider configs (see `stability.md`).

These are baked in as the default endpoints. Override them at call sites if you ship a different deployment.
