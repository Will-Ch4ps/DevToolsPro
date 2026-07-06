// dev-tools-hub-pro/src/main/features/bundler/graph/orphan-classifier.js

const path = require('path');

/**
 * Classifica um arquivo "sem importador" para separar código morto de verdade
 * do que NÃO costuma ser importado por convenção (e portanto não é suspeito):
 *  - 'types'     : declarações (*.d.ts)
 *  - 'test'      : testes e stories (test/spec/stories)
 *  - 'config'    : configs de ferramentas (next/tailwind/postcss/eslint/drizzle/…)
 *  - 'framework' : convenções que o framework usa sozinho (Next App Router, middleware…)
 *  - 'entry'     : pontos de entrada (index/main/server/app/cli…)
 *  - 'code'      : arquivo comum sem uso → provável código morto
 *
 * Para estender: acrescente basenames/padrões nos conjuntos abaixo.
 */

const EXT = '(js|cjs|mjs|ts|cts|mts|tsx|jsx)';
const DECL_RE = /\.d\.ts$/i;
const CONFIG_RE = new RegExp(`\\.config\\.${EXT}$`, 'i');
const TEST_RE = new RegExp(`\\.(test|spec)\\.${EXT}$`, 'i');
const STORY_RE = /\.stories\.(js|ts|tsx|jsx|mdx)$/i;
const RC_RE = /^\.[a-z]+rc(\.(js|cjs|mjs|ts))?$/i; // .eslintrc.js, .prettierrc.cjs…
const STEM_RE = new RegExp(`\\.${EXT}$`, 'i');

const CONFIG_BASENAMES = new Set([
  'plopfile', 'gulpfile', 'gruntfile', 'next-env.d.ts', 'commitlint.config'
]);

// Convenções de framework (Next.js App Router e afins): o framework usa, não é import
const FRAMEWORK_STEMS = new Set([
  'layout', 'page', 'template', 'loading', 'error', 'not-found', 'default', 'route',
  'global-error', 'middleware', 'instrumentation', 'sitemap', 'robots', 'manifest',
  'opengraph-image', 'twitter-image', 'icon', 'apple-icon', 'favicon', 'head'
]);

// Pontos de entrada: não ter importador é esperado
const ENTRY_STEMS = new Set([
  'index', 'main', 'server', 'app', 'cli', 'bootstrap', 'worker', 'entry'
]);

function classifyOrphan(file) {
  const base = path.basename(file).toLowerCase();
  const stem = base.replace(STEM_RE, '');

  if (DECL_RE.test(base)) return 'types';
  if (TEST_RE.test(base) || STORY_RE.test(base)) return 'test';
  if (CONFIG_RE.test(base) || RC_RE.test(base) || CONFIG_BASENAMES.has(stem) || CONFIG_BASENAMES.has(base)) return 'config';
  if (FRAMEWORK_STEMS.has(stem)) return 'framework';
  if (ENTRY_STEMS.has(stem)) return 'entry';

  return 'code';
}

module.exports = { classifyOrphan };
