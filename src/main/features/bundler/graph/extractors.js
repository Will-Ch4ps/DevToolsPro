// dev-tools-hub-pro/src/main/features/bundler/graph/extractors.js

const LANG_EXTS = {
  js: ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.vue', '.svelte'],
  py: ['.py'],
  php: ['.php']
};

const RESOLVE_EXTS = {
  js: [
    '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
    '.vue', '.svelte', '.json', '.css', '.scss', '.sass', '.less'
  ],
  py: ['.py'],
  php: ['.php']
};

const INDEX_FILES = {
  js: [
    'index.ts', 'index.tsx', 'index.js', 'index.jsx',
    'index.mjs', 'index.cjs', 'index.vue', 'index.svelte', 'index.json'
  ],
  py: ['__init__.py'],
  php: []
};

function langForExt(ext) {
  for (const lang in LANG_EXTS) {
    if (LANG_EXTS[lang].includes(ext)) return lang;
  }
  return null;
}

function extractJs(content) {
  const specs = [];

  const patterns = [
    /^\s*import\s+[^'"]*?from\s*['"]([^'"]+)['"]/gm,
    /^\s*import\s+type\s+[^'"]*?from\s*['"]([^'"]+)['"]/gm,
    /^\s*import\s*['"]([^'"]+)['"]/gm,
    /^\s*export\s+[^'"]*?from\s*['"]([^'"]+)['"]/gm,
    /\brequire\(\s*['"]([^'"]+)['"]\s*\)/g,
    /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g
  ];

  for (const re of patterns) {
    let m;
    while ((m = re.exec(content))) {
      if (m[1]) specs.push(m[1]);
    }
  }

  return [...new Set(specs)];
}

function extractPy(content) {
  const specs = [];
  const re = /^\s*from\s+(\.[.\w]*)\s+import\s+/gm;

  let m;
  while ((m = re.exec(content))) {
    if (m[1]) specs.push(m[1]);
  }

  return [...new Set(specs)];
}

function extractPhp(content) {
  const specs = [];
  const re = /\b(?:require|require_once|include|include_once)\s*\(?\s*['"]([^'"]+)['"]/g;

  let m;
  while ((m = re.exec(content))) {
    if (m[1]) specs.push(m[1]);
  }

  return [...new Set(specs)];
}

const EXTRACTORS = {
  js: extractJs,
  py: extractPy,
  php: extractPhp
};

function normalizeSpecifier(spec, lang) {
  if (!spec || typeof spec !== 'string') return null;

  const clean = spec.trim();
  if (!clean) return null;

  if (
    clean.startsWith('http://') ||
    clean.startsWith('https://') ||
    clean.startsWith('node:') ||
    clean.startsWith('data:') ||
    clean.startsWith('virtual:')
  ) {
    return null;
  }

  if (lang === 'js') return clean;

  if (lang === 'php') {
    return clean.startsWith('.') || clean.includes('/') ? clean : null;
  }

  if (lang === 'py') {
    const dotsMatch = clean.match(/^\.+/);
    if (!dotsMatch) return null;

    const dots = dotsMatch[0].length;
    const rest = clean.slice(dots).replace(/\./g, '/');
    const up = '../'.repeat(Math.max(0, dots - 1));

    return './' + up + rest;
  }

  return clean.startsWith('.') ? clean : null;
}

function extractSpecifiers(content, lang) {
  const fn = EXTRACTORS[lang];
  return fn ? fn(content) : [];
}

module.exports = {
  LANG_EXTS,
  RESOLVE_EXTS,
  INDEX_FILES,
  langForExt,
  extractSpecifiers,
  normalizeSpecifier
};
