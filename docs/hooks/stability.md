# Stability — Hook Contract

The Stability page is the active measurement system. It runs handshakes + 100 RTT probes against the selected provider's endpoint, then renders a verdict.

## Import

```html
<script src="../vendor/echarts/echarts.min.js"></script>
<script type="module">
  import "../src/apps/getStability.js";
</script>
```

The module self-registers a `DOMContentLoaded` listener that calls `init()`. Init is internal — there is no public init function.

## Required DOM

### Provider picker

| ID                | Purpose                              | Format                |
|-------------------|--------------------------------------|-----------------------|
| `providerPicker`  | Picker container                     | `<div>`               |
| `providerBtn`     | Picker trigger button                | `<button>`            |
| `providerBtnLabel`| Picker label                         | text                  |
| `providerMenu`    | Picker dropdown list                 | `<ul>`                |

### Run controls

| ID          | Purpose                                | Format         |
|-------------|----------------------------------------|----------------|
| `runBtn`    | Start / re-run the test                | `<button>`     |
| `runDot`    | Pulsing indicator inside the button    | `<span>`       |
| `runLabel`  | Button text                            | text           |

### Hero (idle / running / result states)

The hero has three states, swapped with `hidden` attribute:

- `heroIdle` — initial state ("Run a test")
- `heroRunning` — in-progress state with `heroRunSub` for live status
- `heroResult` — verdict state

| ID                   | Purpose                                       |
|----------------------|-----------------------------------------------|
| `heroIdle`           | Idle container                                |
| `heroRunning`        | Running container                             |
| `heroResult`         | Result container                              |
| `heroRunSub`         | Subtext during run ("12 samples collected")   |
| `heroVerdictLabel`   | "All good" / "Problems found" etc.            |
| `heroHeadline`       | Verdict headline                              |
| `heroConsequence`    | Verdict consequence sentence                  |
| `heroUsecases`       | Container for `.usecase-chip` cards           |

### Metric values

All set via the app. Class manipulation is the renderer's responsibility.

| ID              | Metric            | Class on result           |
|-----------------|-------------------|---------------------------|
| `val-median`    | Median RTT        | `.metric-val`             |
| `val-p90`       | p90 RTT           | `.warn` if > 200 ms       |
| `val-min`       | Min RTT           | —                         |
| `val-max`       | Max RTT           | —                         |
| `val-jitter`    | Median RTT delta  | —                         |
| `val-samples`   | "X / Y" samples   | —                         |
| `val-cold`      | Cold handshake    | `.dim` if null            |
| `val-warm`      | Warm handshake    | `.dim` if null            |
| `meta-cold`     | "First probe…"    | text                      |
| `meta-warm`     | "After 6 warmup"  | text                      |

### Scores

| ID                  | Score             | Class names                 |
|---------------------|-------------------|-----------------------------|
| `score-latency`     | Responsiveness    | `.excellent` / `.good` / …  |
| `score-stability`   | Consistency       | `.excellent` / `.good` / …  |
| `score-reliability` | Reliability       | `.excellent` / `.good` / …  |

### Verdict panel

| ID              | Purpose                                            |
|-----------------|----------------------------------------------------|
| `verdict`       | Container (kept visible)                           |
| `verdictList`   | `<div>` populated with `.verdict-card` children    |

### Charts

| ID           | Chart                | Vendor                |
|--------------|----------------------|-----------------------|
| `liveChart`  | Live RTT over time   | ECharts (canvas)      |
| `distChart`  | Inter-sample deltas  | ECharts (canvas)      |

Each chart has a "no data" placeholder and a sample-count tag:

- `liveIdle` / `liveTag`
- `distIdle` / `distTag`

### Status + advanced

| ID                | Purpose                                          |
|-------------------|--------------------------------------------------|
| `statusDot`       | Top status indicator (`.ok` / `.err`)            |
| `statusText`      | Top status text                                  |
| `advancedToggle`  | Container, shown after a run completes           |
| `advancedPanel`   | `<details>`-like panel, toggled by `advancedBtn` |
| `advancedBtn`     | Button toggling `advancedPanel`                  |

## Optional DOM

| ID             | Purpose                                          |
|----------------|--------------------------------------------------|
| `tor-banner`   | Shown when `client.country === "T1"`             |

## Behaviour

On load:
1. Fetches `/assets/data/providers.json`, populates the picker, defaults to the first provider.
2. Calls `getConnectionInfo()` and toggles `tor-banner.visible` if Tor is detected.
3. Hero shows idle state.

On `runBtn` click:
1. Disables the picker, swaps hero to running state, initialises the live chart.
2. Calls `runHealthTest({ endpoint, intervalMs, timeoutMs, onLatencySample })` from `getStability.js`.
3. Streams samples into the live chart via `onLatencySample({ ttfb })`.
4. Computes verdict via `interpret(result)`.
5. Populates all metric values, scores, hero result, verdict list.
6. Re-enables the picker, swaps button label to "Run Again".

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
      // (poor is implicit: above moderate)
    }
  }
}
```

The `baselineProfile.rttBands` overrides the default latency thresholds in `interpret.js`. Providers without a profile are scored against the global defaults.

## Picker API (re-exports from `providerPicker.js`)

```js
import { populateProviders, getSelectedProvider, disablePicker, enablePicker } from "../src/ui/providerPicker.js";
```

- `populateProviders([{ value, label }, …], selectedValue)` — fills the menu and emits the saved selection from `localStorage` if present.
- `getSelectedProvider()` — returns the current `value` string.
- `disablePicker()` / `enablePicker()` — disable/enable the trigger button.

The picker emits a `CustomEvent("provider:change", { detail: <value>, bubbles: true })` on `providerBtn` whenever the user picks a new option.

## External dependencies

- `/api/ping` (or the provider's `endpoint`) — must return `204 No Content` with `Cache-Control: no-store`.
- `/api/info` — for the Tor detection banner.
- `/assets/data/providers.json` — array of provider configs.
- ECharts (`window.echarts`) — required for the live and distribution charts.
