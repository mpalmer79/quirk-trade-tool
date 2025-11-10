// netlify/functions/jdpower.ts
import type { Handler } from "@netlify/functions";

export const handler: Handler = async (event) => {
  try {
    const API_KEY = process.env.JDPOWER_API_KEY!;
    const BASE = process.env.JDPOWER_BASE_URL || "https://cloud.jdpower.ai/data-api/valuationservices";
    if (!API_KEY) {
      return { statusCode: 500, body: JSON.stringify({ error: "JDPOWER_API_KEY missing" }) };
    }

    const qs = new URLSearchParams(event.queryStringParameters || {});
    const mode = (qs.get("mode") || "value").toLowerCase();

    let upstreamUrl = "";
    if (mode === "lookup") {
      // Required for lookup
      const modelyear = qs.get("modelyear");
      const make = qs.get("make");
      const model = qs.get("model");
      const period = qs.get("period") || "0"; // current period
      if (!modelyear || !make || !model) {
        return { statusCode: 400, body: JSON.stringify({ error: "Missing modelyear/make/model for lookup" }) };
      }
      upstreamUrl = `${BASE}/valuation/bodies?period=${encodeURIComponent(period)}&modelyear=${encodeURIComponent(modelyear)}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`;
    } else {
      // Required for value
      const ucgvehicleid = qs.get("ucgvehicleid");
      const mileage = qs.get("mileage") || "0";
      const region = qs.get("region") || "1";
      const period = qs.get("period") || "0";
      if (!ucgvehicleid) {
        return { statusCode: 400, body: JSON.stringify({ error: "Missing ucgvehicleid for value" }) };
      }
      upstreamUrl = `${BASE}/valuation/valueByVehicleId?period=${encodeURIComponent(period)}&ucgvehicleid=${encodeURIComponent(ucgvehicleid)}&region=${encodeURIComponent(region)}&mileage=${encodeURIComponent(mileage)}`;
    }

    const resp = await fetch(upstreamUrl, { headers: { "api-key": API_KEY } });
    const text = await resp.text();

    return {
      statusCode: resp.status,
      body: text,
      headers: { "content-type": resp.headers.get("content-type") || "application/json" }
    };
  } catch (err: any) {
    return { statusCode: 500, body: JSON.stringify({ error: String(err?.message || err) }) };
  }
};
