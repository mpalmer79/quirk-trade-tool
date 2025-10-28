export const API_BASE = (() => {
  const raw = process.env.NEXT_PUBLIC_API_BASE?.trim();
  if (!raw) return "";                            // fall back to VPIC in the code
  const isProd = typeof window !== "undefined" &&
                 window.location.hostname !== "localhost";
  if (isProd && /localhost|127\.0\.0\.1/i.test(raw)) return ""; // ignore localhost on prod
  return raw.replace(/\/+$/, "");
})();
