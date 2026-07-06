// dev-tools-hub-pro/src/renderer/features/bundler/lib/path-label.js

/**
 * Rótulo curto e legível para um caminho (últimos 2 segmentos).
 * Ex.: ".../features/bundler/state.js" -> "bundler/state.js"
 */
export function pathLabel(p) {
  const parts = String(p).replace(/\\/g, '/').split('/').filter(Boolean);
  return parts.slice(-2).join('/');
}
