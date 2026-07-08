# DOM contracts

Each page expects certain element IDs to exist in the HTML. If an ID is missing, the corresponding data is silently skipped.

## Home page (`/`)

| ID | Purpose |
|----|---------|
| `hero-ip` | Client IP address |
| `hero-location` | Client city + country |
| `hero-status-dot` | Connection status indicator |
| `hero-status-text` | Status message |
| `refreshBtn` | Refresh button |
| `hf-originASOrg` | ISP / organisation name |
| `hf-asn` | ASN (e.g. `AS15169`) |
| `hf-tls` | TLS version |
| `hf-http` | HTTP version |
| `map` | Leaflet map container |
| `map-overlay` | Map overlay info panel |
| `kv-colo` | PoP code |
| `kv-edge-city` | Edge city |
| `kv-edge-country` | Edge country |
| `kv-ray` | Ray ID |
| `tor-banner` | Tor warning banner (shown/hidden) |

## Info page (`/info/`)

| ID | Purpose |
|----|---------|
| `cl-ip` | Client IP |
| `cl-city` | Client city |
| `cl-region` | Client region |
| `cl-country` | Client country |
| `cl-continent` | Client continent |
| `cl-timezone` | Client timezone |
| `net-originASOrg` | Organisation |
| `net-asn` | ASN (link to bgp.tools) |
| `proto-tls-badge` | TLS version |
| `proto-http-badge` | HTTP version |
| `edge-colo` | PoP code |
| `edge-city` | Edge city |
| `edge-country` | Edge country |
| `edge-country-code` | Edge country code |
| `edge-ray` | Ray ID |
| `error-banner` | Error banner (shown on failure) |
| `tor-banner` | Tor warning |

## Stability page (`/stability/`)

| ID | Purpose |
|----|---------|
| `providerPicker` | Provider dropdown container |
| `providerBtn` | Provider dropdown trigger |
| `providerBtnLabel` | Selected provider label |
| `providerMenu` | Provider options list |
| `runBtn` | Run test button |
| `runDot` | Status dot on run button |
| `runLabel` | Button text |
| `heroIdle` | Idle state container |
| `heroRunning` | Running state container |
| `heroResult` | Result state container |
| `heroRunSub` | Running status text |
| `heroVerdictLabel` | Verdict level label |
| `heroHeadline` | Verdict headline |
| `heroConsequence` | Verdict consequence |
| `heroUsecases` | Use case chips |
| `statusDot` | Status indicator |
| `statusText` | Status message |
| `val-median` | Median RTT |
| `val-p90` | P90 RTT |
| `val-min` | Minimum RTT |
| `val-max` | Maximum RTT |
| `val-jitter` | Median jitter |
| `val-samples` | Sample count |
| `val-cold` | Cold handshake RTT |
| `val-warm` | Warm handshake RTT |
| `val-delta` | Cold-warm delta |
| `meta-cold` | Cold handshake description |
| `meta-warm` | Warm handshake description |
| `score-latency` | Responsiveness score |
| `score-stability` | Stability score |
| `score-reliability` | Reliability score |
| `liveChart` | Live RTT chart container |
| `distChart` | Jitter distribution chart container |
| `liveIdle` | Live chart idle message |
| `distIdle` | Distribution chart idle message |
| `liveTag` | Live chart sample count |
| `distTag` | Distribution chart tag |
| `verdict` | Findings container |
| `verdictList` | Findings list |
| `advancedToggle` | Advanced panel toggle |
| `advancedBtn` | Advanced button |
| `advancedPanel` | Advanced panel |
| `tor-banner` | Tor warning |
