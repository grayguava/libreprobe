# Info — Hook Contract

The Info page is a one-shot consumer of the `/api/info` endpoint. It runs `getConnectionInfo()` on load and on demand.

## Import

```html
<script type="module">
  import "../src/apps/connectionInfoRenderer.js";
</script>
```

The module self-registers a `DOMContentLoaded` listener. No init function is exported — wiring is internal.

## Required DOM

| ID                    | Purpose                                            | Format          |
|-----------------------|----------------------------------------------------|-----------------|
| `hero-ip`             | Your public IP (hero card)                         | text            |
| `hero-location`       | Region + country (hero card)                       | text            |
| `status-dot`          | Connection indicator (hero card)                   | `.ok` / `.err`  |
| `status-text`         | "Connected · LHR" or "Connection failed"           | text            |
| `hf-originASOrg`      | Origin AS organisation (hero facts)                | text            |
| `hf-asn`              | ASN, e.g. "AS13335" (hero facts)                   | text            |
| `hf-tls`              | TLS version (hero facts)                           | text            |
| `hf-http`             | HTTP version (hero facts)                          | text            |
| `kv-colo`             | Edge IATA code (key-value strip)                   | text            |
| `kv-edge-city`        | Edge city (key-value strip)                        | text            |
| `kv-edge-country`     | Edge country (key-value strip)                     | text            |
| `kv-ray`              | Cloudflare Ray ID (key-value strip)                | text            |
| `hdr-ip`              | Header-strip IP                                    | text            |
| `hdr-ray`             | Header-strip Ray ID                                | text            |
| `cl-ip`               | Client IP (detail section)                         | text            |
| `cl-city`             | Client city                                        | text            |
| `cl-region`           | Client region/state                                | text            |
| `cl-country`          | Client country (or "Tor Network" for `T1`)         | text            |
| `cl-continent`        | Client continent                                   | text            |
| `cl-timezone`         | Client timezone                                    | text            |
| `net-originASOrg`     | Origin AS org (detail section)                     | text            |
| `net-asn`             | ASN with link to bgp.tools (detail section)        | text + `href`   |
| `proto-tls-badge`     | TLS version badge                                  | text            |
| `proto-http-badge`    | HTTP version badge                                 | text            |
| `edge-colo`           | Edge IATA (detail section)                         | text            |
| `edge-city`           | Edge city                                          | text            |
| `edge-country`        | Edge country                                       | text            |
| `edge-country-code`   | Edge country code                                  | text            |
| `edge-ray`            | Edge Ray ID                                        | text            |
| `path-client-city`    | Client city (path diagram)                         | text            |
| `path-client-loc`     | Region + country (path diagram)                    | text            |
| `path-client-ip`      | Client IP (path diagram)                           | text            |
| `path-pop`            | Edge IATA (path diagram)                           | text            |
| `path-edge-city`      | Edge city (path diagram)                           | text            |
| `path-ray`            | Edge Ray ID (path diagram)                         | text            |

All elements that receive data also have their `.skeleton` class removed on success.

## Optional DOM

| ID              | Purpose                                                | Behaviour if missing                      |
|-----------------|--------------------------------------------------------|-------------------------------------------|
| `hero-status-dot` | Mirror of `status-dot` for the hero                  | skipped                                   |
| `hero-status-text`| Mirror of `status-text` for the hero                 | skipped                                   |
| `error-banner`  | Shown when `/api/info` fails                           | hidden                                    |
| `tor-banner`    | Shown when `client.country === "T1"`                   | hidden                                    |
| `refreshBtn`    | Re-runs the info fetch on click                        | no listener registered                    |
| `map`           | Leaflet container; needs `window.L` and CSS            | renderer skipped (no error)              |

## Side effects

- On `DOMContentLoaded`: calls `getConnectionInfo()` once.
- On `refreshBtn` click (if present): calls `getConnectionInfo()` again, toggles `.spinning` on the button during the call.
- Sets `body.style.overflow` via the navigation module if you also import it.

## External dependencies

- `/api/info` — must respond with the JSON shape in `workers/api/info/index.js`.
- `/assets/data/cloudflare-edge-locations.json` — keyed by IATA colo code.
- Leaflet (`window.L`) — required **only** if you ship the `map` element. Load `vendor/leaflet/leaflet.js` and `leaflet.css` first.

## Result data

The renderer reads the `getConnectionInfo()` result, which returns:

```js
{
  client:   { ip, city, region, country, continent, timezone, latitude, longitude },
  network:  { asn, originAsOrg },
  protocol: { tlsVersion, httpVersion },
  edge:     { colo, rayId, city, country, countryCode, latitude, longitude }
}
```

If `result.error === true`, the status dot turns red, the status text reads "Connection failed", and the `error-banner` (if present) is shown.
