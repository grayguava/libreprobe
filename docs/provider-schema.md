# Provider schema

Providers are defined in `assets/data/providers.json` as an array of objects.

## Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier (used in localStorage) |
| `name` | string | Human-readable name shown in the picker |
| `endpoint` | string | URL or path for probes (can be relative or absolute) |
| `recommendedIntervalMs` | number | Delay between probes in ms |
| `timeoutMs` | number | Per-probe timeout in ms |
| `stability` | string | `"controlled"` or `"public"` — affects error expectations |
| `baselineProfile` | object | Optional. Overrides default scoring thresholds |

### `baselineProfile`

| Field | Type | Description |
|-------|------|-------------|
| `description` | string | Free-text description of the provider's network |
| `expectedBehavior` | string | Free-text expected behavior for findings |
| `rttBands` | object | Threshold overrides for responsiveness scoring |

#### `rttBands`

| Field | Description |
|-------|-------------|
| `excellent` | RTT at or below this value is considered excellent |
| `good` | RTT at or below this value is considered good |
| `moderate` | RTT at or below this value is considered moderate |

Values above `moderate` are scored as `poor`; values above `poor` (from global defaults, 600 ms) are `critical`.

## Example

```json
{
  "id": "cf",
  "name": "Cloudflare Worker",
  "endpoint": "/api/ping",
  "recommendedIntervalMs": 100,
  "timeoutMs": 3000,
  "stability": "controlled",
  "baselineProfile": {
    "description": "Cloudflare edge network",
    "expectedBehavior": "Fast, stable responses with aggressive connection reuse",
    "rttBands": {
      "excellent": 60,
      "good": 120,
      "moderate": 250
    }
  }
}
```

## Default providers

| ID | Name | Type |
|----|------|------|
| `cf` | Cloudflare Worker | Controlled |
| `jsdelivr` | jsDelivr | Public |
| `unpkg` | unpkg | Public |
| `cdnjs` | cdnjs | Public |
| `github_raw` | GitHub Raw | Public |
| `wikimedia` | Wikimedia | Public |
