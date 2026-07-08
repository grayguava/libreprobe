import { probeRTT } from "./probe.js";
import { Sampler } from "./sampler.js";

const FIXED_SAMPLES = 100;

function percentile(sorted, p) {
  const idx = Math.ceil(p * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function computeStats(validSamples, rawResults) {
  const total = rawResults.length;

  const errorCounts = { timeout: 0, dns_fail: 0, network_error: 0, fetch_error: 0, abort: 0 };
  rawResults.forEach(r => {
    if (r?.error_type && r.error_type !== null) {
      errorCounts[r.error_type] = (errorCounts[r.error_type] || 0) + 1;
    }
  });

  if (!validSamples.length) {
    return {
      samples: 0,
      attempts: total,
      errors: errorCounts,
      median: null,
      p90: null,
      min: null,
      max: null,
      latency_variance: null,
      jitter_median: null,
      jitter_p95: null,
      loss: 1,
      effective_cadence: null
    };
  }

  const sorted = [...validSamples].sort((a, b) => a - b);
  const n = sorted.length;

  const median = percentile(sorted, 0.5);
  const p90 = percentile(sorted, 0.9);
  const min = sorted[0];
  const max = sorted[n - 1];

  const avg = validSamples.reduce((a, b) => a + b, 0) / n;
  const variance = validSamples.reduce((acc, v) => acc + (v - avg) ** 2, 0) / n;
  const latency_variance = Math.sqrt(variance);

  const deltas = [];
  for (let i = 1; i < validSamples.length; i++) {
    deltas.push(Math.abs(validSamples[i] - validSamples[i - 1]));
  }
  const sortedDeltas = deltas.sort((a, b) => a - b);
  const jitter_median = deltas.length ? percentile(sortedDeltas, 0.5) : null;
  const jitter_p95 = deltas.length ? percentile(sortedDeltas, 0.95) : null;

  const totalDuration = rawResults.length > 0 ? rawResults[rawResults.length - 1].t : 0;
  const effective_cadence = total > 1 ? totalDuration / (total - 1) : null;

  return {
    samples: n,
    attempts: total,
    errors: errorCounts,
    median,
    p90,
    min,
    max,
    latency_variance,
    jitter_median,
    jitter_p95,
    loss: (total - n) / total,
    effective_cadence
  };
}

export async function measureRTT({
  endpoint = "/api/ping",
  intervalMs = 100,
  timeoutMs = 3000,
  onSample
} = {}) {

  const sampler = new Sampler(intervalMs);

  const raw = await sampler.run(async () => {
    const result = await probeRTT(endpoint, null, timeoutMs);

    const ttfb = result.ok && result.ttfb != null ? result.ttfb : null;

    if (onSample) {
      onSample({ ttfb, error_type: result.error_type });
    }

    return result;
  }, FIXED_SAMPLES);

  const rawResults = raw.map(s => s.v);
  const validSamples = rawResults
    .filter(r => r !== null && r !== undefined)
    .map(r => r.ttfb)
    .filter(v => v !== null);

  const rawChronological = raw.map(s => ({
    t: s.t,
    ttfb: s.v?.ttfb ?? null,
    error_type: s.v?.error_type ?? null
  }));

  return {
    samples: FIXED_SAMPLES,
    intervalMs,
    durationMs: raw.length ? raw[raw.length - 1].t : 0,
    ...computeStats(validSamples, rawResults),
    raw_ttfb: validSamples,
    raw_chronological: rawChronological
  };
}