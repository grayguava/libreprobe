# Scoring

Three scores are produced for every stability test: responsiveness, stability, and reliability. Each is a five-point scale: `excellent`, `good`, `moderate`, `poor`, `critical`.

## Responsiveness

Based on median RTT. Thresholds can be overridden per-provider via `baselineProfile.rttBands`.

| Score | Default range |
|-------|---------------|
| excellent | ≤ 50 ms |
| good | ≤ 150 ms |
| moderate | ≤ 300 ms |
| poor | ≤ 600 ms |
| critical | > 600 ms |

## Stability

Based on the ratio of median jitter to median RTT (`jitter_median / median`).

| Score | Jitter/median ratio |
|-------|---------------------|
| excellent | ≤ 0.15 |
| good | ≤ 0.30 |
| moderate | ≤ 0.50 |
| poor | ≤ 0.80 |
| critical | > 0.80 |

## Reliability

Based on loss rate (`failed / total`).

| Score | Loss rate |
|-------|-----------|
| excellent | ≤ 0.02 (2%) |
| good | ≤ 0.05 (5%) |
| moderate | ≤ 0.12 (12%) |
| poor | ≤ 0.25 (25%) |
| critical | > 0.25 |

## Verdict

The verdict combines all three scores into a single level:

| Level | Meaning |
|-------|---------|
| `great` | All metrics excellent |
| `ok` | Acceptable, minor variance |
| `slow` | Elevated latency or some failures |
| `unstable` | High variance |
| `bad` | Significant problems (critical latency or reliability) |

## Findings

Each finding has a severity (`ok`, `warn`, `err`) and covers one aspect of the result. Findings are sorted by severity. Tips are shown when the finding is actionable (e.g. bufferbloat, Wi-Fi congestion, TLS resumption).

## Spike detection

The p90/median ratio is checked against three thresholds:

| Ratio | Label |
|-------|-------|
| ≤ 1.6 | Low Spikes |
| ≤ 2.2 | Moderate Spikes |
| ≤ 3.0 | Frequent Spikes |
| > 3.0 | Heavy Spikes |

Heavy spikes trigger a bufferbloat tip.

## Warm RTT

Warm handshake RTT is checked against these thresholds:

| Threshold | Label |
|-----------|-------|
| ≤ 120 ms | Normal |
| ≤ 250 ms | Elevated |
| ≤ 400 ms | High |
| > 400 ms | Very High |

## Cold-warm delta

The difference between cold and warm handshake RTT indicates connection overhead:

| Delta | Note |
|-------|------|
| ≥ 100 ms | Warn — connection overhead flagged |
| ≥ 200 ms | Elevated overhead flagged |
