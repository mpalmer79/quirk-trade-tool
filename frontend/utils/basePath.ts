/**
 * Get the basePath for the application
 * This ensures redirects work correctly when deployed to GitHub Pages
 */
export function getBasePath(): string {
  // In production (GitHub Pages), this will be '/quirk-trade-tool'
  // In development, this will be an empty string
  return process.env.NEXT_PUBLIC_BASE_PATH || '';
}

/**
 * Navigate to a path with basePath included
 * Use this instead of window.location.href for redirects
 */
export function navigateWithBasePath(path: string): void {
  const basePath = getBasePath();
  window.location.href = `${basePath}${path}`;
}
