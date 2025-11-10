import type { Handler } from "@netlify/functions";

export const handler: Handler = async (event) => {
  const vin = event.queryStringParameters?.vin;
  if (!vin) return { statusCode: 400, body: JSON.stringify({ error: "Missing vin" }) };

  const upstream = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${encodeURIComponent(vin)}?format=json`);
  const body = await upstream.text();
  return {
    statusCode: upstream.status,
    body,
    headers: { "content-type": upstream.headers.get("content-type") || "application/json" }
  };
};
