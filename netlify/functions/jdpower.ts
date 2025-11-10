import type { Handler } from "@netlify/functions";

export const handler: Handler = async (event) => {
  const API_KEY = process.env.JDPOWER_API_KEY!;
  const baseUrl = process.env.JDPOWER_BASE_URL || "https://cloud.jdpower.ai/data-api/valuationservices";

  const qs = new URLSearchParams(event.queryStringParameters || {});
  
  const upstream = await fetch(`${baseUrl}/valuation/valueByVehicleId?${qs}`, {
    headers: {
      "api-key": API_KEY
      // Or if their spec uses a different header: "Authorization": `Bearer ${API_KEY}`
    }
  });

  const body = await upstream.text();

  return {
    statusCode: upstream.status,
    body,
    headers: {
      "content-type": upstream.headers.get("content-type") || "application/json"
    }
  };
};
