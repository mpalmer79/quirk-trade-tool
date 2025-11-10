import type { Handler } from "@netlify/functions";

export const handler: Handler = async (event) => {
  const vin = event.queryStringParameters?.vin;
  if (!vin) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing VIN" }) };
  }

  const resp = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${vin}?format=json`);
  const body = await resp.text();

  return {
    statusCode: resp.status,
    body,
    headers: { "content-type": resp.headers.get("content-type") || "application/json" }
  };
};
