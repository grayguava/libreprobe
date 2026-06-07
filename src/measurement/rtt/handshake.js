import { probeRTT } from "./probe.js";
import { sleep } from "./sampler.js";


const WARMUP_PROBES = 6;
const WARMUP_INTERVAL_MS = 50;

export async function measureHandshake(
  endpoint = "/api/ping"
) {

  const cold = await probeRTT(endpoint);


  for (let i = 0; i < WARMUP_PROBES; i++) {
    await probeRTT(endpoint);
    await sleep(WARMUP_INTERVAL_MS);
  }

  const warm = await probeRTT(endpoint);

  return {
    cold: cold.ttfb,
    warm: warm.ttfb,
    coldSuccess: cold.ok,
    warmSuccess: warm.ok,
    coldStatus: cold.status,
    warmStatus: warm.status
  };
}