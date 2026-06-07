const T = {
  latency: {
    excellent: 50,
    good: 150,
    moderate: 300,
    poor: 600
  },
  stability: {
    excellent: 0.15,
    good: 0.30,
    moderate: 0.50,
    poor: 0.80
  },
  reliability: {
    excellent: 0.02,
    good: 0.05,
    moderate: 0.12,
    poor: 0.25
  },
  spike: {
    low: 1.6,
    moderate: 2.2,
    high: 3.0
  },
  warm: {
    low: 120,
    moderate: 250,
    high: 400
  },
  delta: {
    low: 100,
    moderate: 200
  }
};

function scoreResponsiveness(median, rttBands = null) {
  if (median == null) return "unknown";
  const bands = rttBands ?? T.latency;
  if (median <= bands.excellent) return "excellent";
  if (median <= bands.good)      return "good";
  if (median <= bands.moderate)  return "moderate";
  if (median <= bands.poor)      return "poor";
  return "critical";
}

function scoreStability(jitterMedian, median) {
  if (jitterMedian == null || median == null || median <= 0) return "unknown";
  const ratio = jitterMedian / median;
  if (ratio <= T.stability.excellent) return "excellent";
  if (ratio <= T.stability.good)      return "good";
  if (ratio <= T.stability.moderate)  return "moderate";
  if (ratio <= T.stability.poor)      return "poor";
  return "critical";
}

function scoreReliability(loss) {
  if (loss == null) return "unknown";
  if (loss <= T.reliability.excellent) return "excellent";
  if (loss <= T.reliability.good)      return "good";
  if (loss <= T.reliability.moderate)  return "moderate";
  if (loss <= T.reliability.poor)      return "poor";
  return "critical";
}

function deriveVerdict(scores, p90, median, jitterMedian, warm, delta) {
  const { latency, stability, reliability } = scores;

  if (latency === "critical" || reliability === "critical") {
    return {
      level: "bad",
      headline: "Route shows significant problems",
      consequence: "High failure rate or unreachable endpoint. Repeated requests are failing or timing out."
    };
  }

  if (stability === "critical" || stability === "poor") {
    return {
      level: "unstable",
      headline: "High variance on this path",
      consequence: "RTT varies significantly between requests. Response times are unpredictable."
    };
  }

  if (reliability === "poor" || reliability === "moderate") {
    return {
      level: "slow",
      headline: "Some requests failed or timed out",
      consequence: "Elevated timeout rate observed. Request completion is inconsistent."
    };
  }

  if (latency === "poor" || latency === "moderate") {
    return {
      level: "slow",
      headline: "Elevated response times on this route",
      consequence: "Median RTT is higher than optimal, but consistency remains stable."
    };
  }

  if (stability === "moderate" || (stability === "good" && latency === "moderate")) {
    return {
      level: "ok",
      headline: "Decent route — some variance observed",
      consequence: "Mostly consistent responses with occasional spikes or variation."
    };
  }

  if (latency === "excellent" && stability === "excellent" && reliability === "excellent") {
    return {
      level: "great",
      headline: "Excellent responsiveness on this path",
      consequence: "Low latency, high consistency, and full request completion. This path is performing well."
    };
  }

  return {
    level: "ok",
    headline: "Acceptable route to this endpoint",
    consequence: "Response times are reasonable. Requests complete consistently."
  };
}

function buildFindings(scores, median, jitterMedian, p90, cold, warm, warmOk, delta, errors, profile) {
  const findings = [];
  const { latency, stability, reliability } = scores;
  const p90Ratio = (median > 0 && p90 != null) ? p90 / median : null;
  const expectedBehavior = profile?.expectedBehavior ?? "typical responses";

  if (latency !== "unknown") {
    const aboveExpected = median > (profile?.rttBands?.moderate ?? 300);
    findings.push({
      severity: latency === "excellent" || latency === "good" ? "ok" : latency === "moderate" ? "warn" : "err",
      headline: "Responsiveness",
      detail: median != null
        ? `${median.toFixed(1)} ms median RTT — ${latency === "excellent" ? "fast" : latency === "good" ? "normal for this path" : aboveExpected ? "elevated for this provider" : "above typical for this provider"}.`
        : "RTT measurement unavailable.",
      tip: null
    });
  }

  if (stability !== "unknown") {
    findings.push({
      severity: stability === "excellent" || stability === "good" ? "ok" : stability === "moderate" ? "warn" : "err",
      headline: "Consistency",
      detail: jitterMedian != null
        ? `${jitterMedian.toFixed(1)} ms median RTT delta — ${stability === "excellent" ? "minimal variance" : stability === "good" ? "low variance for this route" : stability === "moderate" ? "moderate variance" : "high variance"}.`
        : "Consistency measurement unavailable.",
      tip: stability === "moderate" || stability === "poor"
        ? "Wi-Fi congestion, competing downloads, or interference could be contributing. Try a wired connection or 5GHz band."
        : null
    });
  }

  if (reliability !== "unknown") {
    const totalErrors = errors ? Object.values(errors).reduce((a, b) => a + b, 0) : 0;
    findings.push({
      severity: reliability === "excellent" || reliability === "good" ? "ok" : reliability === "moderate" ? "warn" : "err",
      headline: "Reliability",
      detail: totalErrors > 0
        ? `${totalErrors} request(s) failed or timed out. ${reliability === "excellent" ? "Negligible impact." : reliability === "good" ? "Minimal impact." : reliability === "moderate" ? "Some impact on completion rate." : "Significant impact."}`
        : "All requests completed successfully.",
      tip: totalErrors > 2 ? "Check whether your network is dropping packets or the endpoint is having issues." : null
    });
  }

  if (p90Ratio != null) {
    if (p90Ratio > T.spike.high) {
      findings.push({
        severity: "err",
        headline: "Frequent spikes",
        detail: `p90 is ${p90.toFixed(1)} ms — ${((p90Ratio - 1) * 100).toFixed(0)}% above median. Regular outliers detected for this path.`,
        tip: "This looks like bufferbloat. Enable SQM or QoS on your router if available."
      });
    } else if (p90Ratio > T.spike.moderate) {
      findings.push({
        severity: "warn",
        headline: "Occasional spikes",
        detail: `p90 ${p90.toFixed(1)} ms vs. ${median.toFixed(1)} ms median — infrequent outliers present on this route.`,
        tip: null
      });
    }
  }

  if (warm != null) {
    if (!warmOk) {
      findings.push({
        severity: "err",
        headline: "Handshake probe failed",
        detail: "Could not establish a connection after warmup. The path may be blocked or unreachable.",
        tip: "Check whether the server is reachable and your network isn't filtering the probe."
      });
    } else if (warm > T.warm.high) {
      findings.push({
        severity: "warn",
        headline: "High warm RTT",
        detail: `Warm RTT is ${warm.toFixed(1)} ms — response is sluggish even when fully established.`,
        tip: "Server CPU load, database latency, or cold-start delays may be involved."
      });
    }
  }

  if (delta != null && delta >= T.delta.moderate) {
    const severity = delta >= T.delta.low ? "warn" : "ok";
    findings.push({
      severity,
      headline: "Connection overhead",
      detail: `Cold start costs ${delta.toFixed(1)} ms extra (${cold?.toFixed(1) ?? "?"} ms cold vs. ${warm?.toFixed(1) ?? "?"} ms warm). Fresh connections carry overhead.`,
      tip: delta >= T.delta.low ? "Enable HTTP/2 or HTTP/3 for connection reuse. Check TLS session resumption on the server." : null
    });
  }

  const rank = { err: 0, warn: 1, ok: 2 };
  findings.sort((a, b) => rank[a.severity] - rank[b.severity]);

  return findings;
}

export function interpret(result) {
  const lat = result?.latency   ?? {};
  const hs  = result?.handshake ?? {};
  const provider = result?.provider ?? {};

  const median        = lat.median        ?? null;
  const jitterMedian  = lat.jitter_median ?? null;
  const p90          = lat.p90           ?? null;
  const loss         = lat.loss          ?? null;
  const cold         = hs.cold            ?? null;
  const warm         = hs.warm            ?? null;
  const warmOk       = hs.warmSuccess    ?? false;
  const delta        = (cold != null && warm != null) ? cold - warm : null;

  const profile = provider?.baselineProfile ?? null;
  const rttBands = profile?.rttBands ?? null;

  const scores = {
    latency:    scoreResponsiveness(median, rttBands),
    stability:  scoreStability(jitterMedian, median),
    reliability: scoreReliability(loss)
  };

  const verdict = deriveVerdict(scores, p90, median, jitterMedian, warm, delta);
  const findings = buildFindings(scores, median, jitterMedian, p90, cold, warm, warmOk, delta, lat.errors, profile);

  const p90Ratio = (median > 0 && (lat?.p90 ?? null) != null) ? lat.p90 / median : null;

  let spikeLabel = "Unknown Spikes";
  let spikeStatus = "ok";
  if (p90Ratio != null) {
    if (p90Ratio <= T.spike.low) {
      spikeLabel = "Low Spikes";
      spikeStatus = "good";
    } else if (p90Ratio <= T.spike.moderate) {
      spikeLabel = "Moderate Spikes";
      spikeStatus = "ok";
    } else if (p90Ratio <= T.spike.high) {
      spikeLabel = "Frequent Spikes";
      spikeStatus = "ok";
    } else {
      spikeLabel = "Heavy Spikes";
      spikeStatus = "poor";
    }
  }

  const usecases = [
    { label: scores.latency === "excellent" ? "Fast RTT" : scores.latency === "good" ? "Normal RTT" : scores.latency === "moderate" ? "Elevated RTT" : "Slow RTT", status: scores.latency === "excellent" || scores.latency === "good" ? "good" : scores.latency === "moderate" ? "ok" : "poor" },
    { label: scores.stability === "excellent" ? "Stable Path" : scores.stability === "good" ? "Low Variance" : scores.stability === "moderate" ? "Moderate Variance" : "High Variance", status: scores.stability === "excellent" || scores.stability === "good" ? "good" : scores.stability === "moderate" ? "ok" : "poor" },
    { label: scores.reliability === "excellent" ? "Full Completion" : scores.reliability === "good" ? "High Completion" : scores.reliability === "moderate" ? "Some Failures" : "Failed Requests", status: scores.reliability === "excellent" || scores.reliability === "good" ? "good" : scores.reliability === "moderate" ? "ok" : "poor" },
    { label: spikeLabel, status: spikeStatus },
  ];

  return {
    verdict: { ...verdict, usecases },
    findings,
    scores,
    profile
  };
}