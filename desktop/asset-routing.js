'use strict';
const path = require('node:path');

// Stable, local-only game origin: desktop saves remain in the app's userData
// across upgrades, rather than being tied to a versioned installation path.
function resolveAsset(root, requestUrl) {
  let parsed;
  try { parsed = new URL(requestUrl); }
  catch { return null; }
  if (parsed.protocol !== 'rupeerush:' || parsed.hostname !== 'game' ||
      parsed.username || parsed.password || parsed.port) return null;
  let pathname;
  try { pathname = decodeURIComponent(parsed.pathname); }
  catch { return null; }
  if (pathname.includes('\\') || pathname.includes('\0')) return null;
  const assetRoot = path.resolve(root);
  const target = path.resolve(assetRoot, pathname.replace(/^\/+/, '') || 'index.html');
  if (!target.startsWith(assetRoot + path.sep)) return null;
  return target;
}
module.exports = { resolveAsset };
