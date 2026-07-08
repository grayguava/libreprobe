# Architecture

Libreprobe has two independent systems that share the navigation bar and the Tor banner but otherwise don't depend on each other.

## Info

Passive, server-assisted introspection.

1. The browser fetches `GET /api/info` with a cache-busting query string.
2. The Cloudflare Worker reads `request.cf` properties (populated by Cloudflare's edge before the Worker runs) and a few headers (`CF-Connecting-IP`, `CF-Ray`).
3. The Worker returns a JSON blob with `client`, `network`, `protocol`, and `edge` keys.
4. The browser also fetches `cloudflare-edge-locations.json` (cached) to resolve the three-letter PoP code to a city, country, and coordinates.
5. The renderer populates DOM elements and draws a Leaflet map with a client-to-edge polyline.

No state is carried forward. Every page load fetches fresh data.

### `/api/info` response shape

```json
{
  "client": {
    "ip": "203.0.113.1",
    "city": "Sydney",
    "region": "New South Wales",
    "country": "AU",
    "continent": "OC",
    "timezone": "Australia/Sydney",
    "latitude": -33.86,
    "longitude": 151.2
  },
  "network": {
    "asn": 15169,
    "originAsOrg": "Google LLC"
  },
  "protocol": {
    "tlsVersion": "TLSv1.3",
    "httpVersion": "HTTP/3"
  },
  "edge": {
    "colo": "SYD",
    "rayId": "7f2e1a3b4c5d6e7f-SYD"
  }
}
```

## Stability

Active, client-side measurement.

1. The user selects a provider from the dropdown (populated from `providers.json`).
2. Clicking "Run Test" triggers a cold handshake (one probe), followed by 6 warm-up probes, then a warm handshake probe.
3. The sampler then issues 100 probes at the provider's recommended interval, calling `onLatencySample` after each for the live chart.
4. Results are computed locally: median, p90, min, max, jitter, loss rate, effective cadence.
5. The `interpret()` function scores the results against the provider's baseline profile and produces a verdict with findings and tips.
6. A live line chart (ECharts) streams samples in real time. After completion, a jitter bar chart renders.

No measurement data is sent to any server. The provider preference is persisted in `localStorage`.

### Probe lifecycle

```
Cold probe (1)
6 warm-up probes (50 ms apart)
Warm probe (1)
100 measurement probes (at provider's recommended interval)
→ Stats computed
→ Scored against baseline
→ Verdict + findings generated
```
