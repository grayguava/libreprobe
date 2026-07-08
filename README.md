# Libreprobe

See what your internet connection looks like from the outside — your public IP, which network you're on, your TLS and HTTP version, and which Cloudflare data centre handled your request. Then run a stability test to measure how responsive and consistent your route is to different providers, with results explained in plain language.

No accounts. No tracking. Nothing stored.

## Pages

**Info** — shows your IP address, ASN, ISP, TLS version, HTTP version, the Cloudflare edge that served you (PoP code, city, country), and a map of the path between you and that edge. All data comes from the request itself — nothing is looked up after the fact.

**Stability** — pick a provider (Cloudflare, jsDelivr, unpkg, cdnjs, GitHub Raw, or Wikimedia) and run 100 HTTP probes. The results include median and p90 round-trip time, min/max, jitter, loss rate, a cold vs. warm handshake comparison, and a scored verdict with tips if something needs attention. Each provider has its own baseline, so a 150 ms RTT can be "good" for one and "elevated" for another.

## How it works

Two separate systems that share nothing except the navigation bar.

**Info** is passive. A Cloudflare Worker reads the metadata Cloudflare attaches to every request — your IP, GeoIP, ASN, TLS details, and which edge node handled it — and returns it as JSON. The browser renders the data and a map. The Worker has no storage, no database, and no side effects.

**Stability** is active and runs entirely in your browser. It sends 100 HTTP requests (plus a cold and warm handshake) to the provider endpoint you choose, measures TTFB locally, and scores the results against that provider's expected baseline. No measurement data is ever sent to Libreprobe's servers. The only thing saved is your provider preference, which stays in your browser's localStorage.

Tor is detected automatically — when the country code is `T1`, a banner appears on every page.

## Stack

| Layer | What |
|-------|------|
| Runtime | Cloudflare Workers (V8 isolates) |
| Map tiles | OpenStreetMap via CARTO, rendered with Leaflet |
| Charts | ECharts |
| Frontend | Vanilla JS, no framework, no build step |
| Fonts | Mona Sans · Hubot Sans (self-hosted) |
| Edge locations | Static JSON, synced monthly from Cloudflare |

## Deploy

This is a Cloudflare Pages site. The Workers live in `functions/api/`; static assets are in `assets/`. Drop the repo into Cloudflare Pages or deploy with `wrangler`. That's it.

## Documentation

See [docs/](docs/) for the provider schema, scoring thresholds, per-page DOM contracts, and everything else.

## License

MIT
