// dev-tools-hub-pro/src/main/features/bundler/graph/utils.js

const fs = require('fs/promises');
const path = require('path');

function norm(p) {
  return String(p || '').replace(/\\/g, '/').toLowerCase();
}

function slash(p) {
  return String(p || '').replace(/\\/g, '/');
}

function uniq(arr) {
  return [...new Set((arr || []).filter(Boolean))];
}

function isRelative(spec) {
  return spec === '.' || spec === '..' || spec.startsWith('./') || spec.startsWith('../');
}

function cleanSpecifier(spec) {
  return String(spec || '').trim().split('?')[0].split('#')[0];
}

async function readJson(file) {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch {
    return null;
  }
}

function matchPattern(pattern, spec) {
  if (!pattern || !spec) return null;

  if (!pattern.includes('*')) {
    return pattern === spec ? '' : null;
  }

  const [pre, post = ''] = pattern.split('*');

  if (!spec.startsWith(pre)) return null;
  if (post && !spec.endsWith(post)) return null;

  return spec.slice(pre.length, post ? spec.length - post.length : spec.length);
}

function applyTarget(target, star) {
  if (typeof target !== 'string') return null;

  const out = target.includes('*')
    ? target.replace(/\*/g, star || '')
    : target;

  return out.replace(/^\.\//, '');
}

function noExtName(file) {
  return path.basename(file).replace(/\.(js|jsx|ts|tsx|mjs|cjs)$/i, '');
}

function isSourceFile(file) {
  return ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.vue', '.svelte']
    .includes(path.extname(file).toLowerCase());
}

function addEdge(edges, from, to) {
  if (!from || !to || from === to) return;
  if (!edges[from]) edges[from] = [];
  if (!edges[from].includes(to)) edges[from].push(to);
}

function buildFileMaps(files) {
  const byNorm = new Map();
  const byDir = new Map();
  const byBase = new Map();

  for (const f of files) {
    byNorm.set(norm(f), f);

    const dirKey = norm(path.dirname(f));
    if (!byDir.has(dirKey)) byDir.set(dirKey, []);
    byDir.get(dirKey).push(f);

    const baseKey = path.basename(f).toLowerCase();
    if (!byBase.has(baseKey)) byBase.set(baseKey, []);
    byBase.get(baseKey).push(f);
  }

  return { byNorm, byDir, byBase };
}

module.exports = {
  norm,
  slash,
  uniq,
  isRelative,
  cleanSpecifier,
  readJson,
  matchPattern,
  applyTarget,
  noExtName,
  isSourceFile,
  addEdge,
  buildFileMaps
};
