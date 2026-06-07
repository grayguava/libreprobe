# Libreprobe

A measurement engine for inspecting the **route to a specific endpoint** — your public IP, ASN, TLS version, the edge that served you, and the RTT profile of repeated probes.

This repository is the engine + hook contract. It contains no HTML, no CSS, no fonts, no branding. You bring your own skin.

## What's in the box

```
src/
  apps/                # Page-level apps (Info renderer, Stability runner)
  measurement/         # Probes, samplers, scoring
  ui/                  # Provider picker, navigation
workers/api/
  info/                # GET /api/info — passive introspection
  ping/                # GET /api/ping — 204 No Content
data/                  # Edge map, provider list
vendor/                # Leaflet, ECharts
docs/hooks/            # Per-page hook contracts
examples/              # 3 minimal HTML files wired to the hooks
```

## What you get

- **Info** — a single `getConnectionInfo()` call returns your IP, ASN, edge, TLS/HTTP version, GeoIP. Wire it into a layout, you're done.
- **Stability** — 100 RTT probes against a configurable endpoint, producing median, p90, variance, reliability, and a provider-aware verdict ("All good" / "Problems found" / etc.).
- **Scoring** — responsiveness, consistency, reliability on a fixed scale (`excellent` → `critical`), with per-provider `baselineProfile.rttBands` overrides.
- **Tor detection** — flagged via `client.country === "T1"`.
- **No external runtime deps** beyond the vendored Leaflet + ECharts and the two Cloudflare Workers.

## Quick start

1. Drop the workers under your Cloudflare Pages site's `functions/api/` directory (or deploy via `wrangler` using `wrangler.toml.example`).
2. Serve `data/*.json` and `vendor/*` from your static host.
3. Open `examples/info.html` or `examples/stability.html` to see the engine running with the bare minimum HTML.

The examples are intentionally unstyled. They're a contract test, not a UI.

## Hook contract

See [`docs/hooks/README.md`](./docs/hooks/README.md) for the overview and per-page contracts:

- [`docs/hooks/home.md`](./docs/hooks/home.md) — landing page
- [`docs/hooks/info.md`](./docs/hooks/info.md) — Info renderer
- [`docs/hooks/stability.md`](./docs/hooks/stability.md) — Stability runner

Each page doc lists required DOM elements, optional ones, side effects, and the data the app reads/writes. The examples implement every required ID.

## Required deployments

The apps assume the following paths exist on the same origin (or wherever you point them):

| Path                                       | Purpose                              |
|--------------------------------------------|--------------------------------------|
| `GET /api/info`                            | JSON: client/network/protocol/edge   |
| `GET /api/ping`                            | 204 No Content, `Cache-Control: no-store` |
| `GET /assets/data/cloudflare-edge-locations.json` | IATA → city/country/lat/lon     |
| `GET /assets/data/providers.json`          | Array of provider configs            |

The defaults in the source use these paths. If you serve from a different layout, edit the source or wrap the apps in your own initialization.

## Provider schema

`providers.json` is an array of:

```js
{
  id: "cf",
  name: "Cloudflare Worker",
  endpoint: "/api/ping",
  recommendedIntervalMs: 100,
  timeoutMs: 3000,
  stability: "controlled",     // "controlled" | "public"
  baselineProfile: {
    description: "Cloudflare edge network",
    expectedBehavior: "Fast, stable responses with aggressive connection reuse",
    rttBands: {
      excellent: 60,
      good: 120,
      moderate: 250
    }
  }
}
```

The `baselineProfile.rttBands` overrides the default latency thresholds in `interpret.js`. Providers without a profile are scored against the global defaults.

## Architecture

Two systems, deliberately separate:

- **Info** — passive, infrastructure-assisted introspection. The browser calls `/api/info`, the Worker reads `request.cf` and headers, returns the data. The renderer draws a map and a key-value grid.
- **Stability** — active, client-side measurement. The browser issues 100 probes (plus a cold + warm handshake) against a chosen endpoint, the Worker responds with 204, the client computes stats. The renderer draws a live chart, a distribution chart, and a verdict.

You can use either system without the other. The Info renderer doesn't require Stability. The Stability runner only needs the `/api/info` endpoint for the Tor banner.

## License

[MIT](./LICENSE)

Third-party library licenses (Leaflet, ECharts) live at [`vendor/LICENSES.md`](./vendor/LICENSES.md).
