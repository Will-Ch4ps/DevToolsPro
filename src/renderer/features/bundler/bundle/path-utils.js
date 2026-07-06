// dev-tools-hub-pro/src/renderer/features/bundler/bundle/path-utils.js

const path = require('path');

/**
 * Utilitários puros de conversão de caminho para os modos "somente pastas/paths"
 */

export function toPosixRelLocal(rootAbs, targetAbs) {
  try {
    const rel = path.relative(rootAbs, targetAbs);
    if (!rel || rel.startsWith('..')) return null;
    return rel.replace(/\\/g, '/');
  } catch {
    return null;
  }
}

export function prefixRootLocal(rootName, rel) {
  if (!rel) return rootName;
  return `${rootName}/${rel}`;
}

export function toPosixRelRemote(rootPosix, absPosix) {
  try {
    const rel = path.posix.relative(rootPosix, absPosix);
    if (!rel || rel.startsWith('..')) return null;
    return rel; // já é posix
  } catch {
    return null;
  }
}

export function deriveFoldersFromRelFiles(relFiles) {
  const set = new Set();

  // representa "raiz"
  set.add('./');

  for (const f of relFiles) {
    const dir = path.posix.dirname(f);
    if (!dir || dir === '.' || dir === '/') {
      set.add('./');
      continue;
    }

    // adiciona todos os níveis: a/b/c/file -> a/, a/b/, a/b/c/
    const parts = dir.split('/').filter(Boolean);
    let acc = '';
    for (const part of parts) {
      acc = acc ? `${acc}/${part}` : part;
      set.add(acc);
    }
  }

  return set;
}
