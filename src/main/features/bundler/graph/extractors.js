// dev-tools-hub-pro/src/main/features/bundler/graph/extractors.js

/**
 * Conhecimento por linguagem para o grafo de dependências.
 *
 * Para adicionar suporte a uma nova linguagem, registre nos 4 mapas abaixo:
 *  - LANG_EXTS:    extensões dos arquivos daquela linguagem
 *  - RESOLVE_EXTS: extensões tentadas ao resolver um import sem extensão
 *  - INDEX_FILES:  arquivos "índice" de uma pasta (ex.: index.js, __init__.py)
 *  - EXTRACTORS:   função que extrai os "specifiers" crus do conteúdo
 * ...e (opcional) um normalizador em NORMALIZERS se a sintaxe do import não
 * for um caminho de arquivo (ex.: pontos do Python).
 */

const LANG_EXTS = {
  js: ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.vue', '.svelte'],
  py: ['.py'],
  php: ['.php']
};

const RESOLVE_EXTS = {
  js: ['.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs', '.vue', '.svelte', '.json'],
  py: ['.py'],
  php: ['.php']
};

const INDEX_FILES = {
  js: ['index.js', 'index.ts', 'index.jsx', 'index.tsx', 'index.mjs', 'index.cjs'],
  py: ['__init__.py'],
  php: []
};

function langForExt(ext) {
  for (const lang in LANG_EXTS) {
    if (LANG_EXTS[lang].includes(ext)) return lang;
  }
  return null;
}

// --- Extractors: retornam a lista de specifiers crus encontrados no conteúdo ---

function extractJs(content) {
  const specs = [];
  const patterns = [
    /^\s*import\s+[^'"]*?from\s*['"]([^'"]+)['"]/gm, // import x from '...'
    /^\s*import\s*['"]([^'"]+)['"]/gm,               // import '...'
    /^\s*export\s+[^'"]*?from\s*['"]([^'"]+)['"]/gm, // export ... from '...'
    /\brequire\(\s*['"]([^'"]+)['"]\s*\)/g,          // require('...')
    /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g            // import('...') dinâmico
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(content))) specs.push(m[1]);
  }
  return specs;
}

function extractPy(content) {
  const specs = [];
  // Só imports relativos (começam com ponto): from .mod import x | from ..pkg.sub import y
  const re = /^\s*from\s+(\.[.\w]*)\s+import\s+/gm;
  let m;
  while ((m = re.exec(content))) specs.push(m[1]);
  return specs;
}

function extractPhp(content) {
  const specs = [];
  const re = /\b(?:require|require_once|include|include_once)\s*\(?\s*['"]([^'"]+)['"]/g;
  let m;
  while ((m = re.exec(content))) specs.push(m[1]);
  return specs;
}

const EXTRACTORS = { js: extractJs, py: extractPy, php: extractPhp };

/**
 * Normaliza um specifier para um caminho relativo estilo POSIX (ou null se for
 * externo / não-resolvível dentro do projeto).
 */
const NORMALIZERS = {
  js: (spec) => (spec.startsWith('.') ? spec : null), // ignora bare imports (node_modules)
  php: (spec) => (spec.startsWith('.') || spec.includes('/') ? spec : null),
  py: (spec) => {
    // '.'      -> mesmo diretório
    // '.mod'   -> ./mod
    // '..a.b'  -> ../a/b
    const dots = spec.match(/^\.+/)[0].length;
    const rest = spec.slice(dots).replace(/\./g, '/');
    const up = '../'.repeat(Math.max(0, dots - 1));
    return './' + up + rest;
  }
};

function extractSpecifiers(content, lang) {
  const fn = EXTRACTORS[lang];
  return fn ? fn(content) : [];
}

function normalizeSpecifier(spec, lang) {
  const fn = NORMALIZERS[lang];
  return fn ? fn(spec) : (spec.startsWith('.') ? spec : null);
}

module.exports = {
  LANG_EXTS,
  RESOLVE_EXTS,
  INDEX_FILES,
  langForExt,
  extractSpecifiers,
  normalizeSpecifier
};
