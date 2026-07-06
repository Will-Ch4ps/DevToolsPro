// dev-tools-hub-pro/src/main/features/bundler/graph/hints.js

const path = require('path');
const { norm, noExtName, isSourceFile, addEdge } = require('./utils.js');

/**
 * Hints liberais para frameworks modernos.
 *
 * Resolve relações que não aparecem como import explícito:
 * - Next App Router:
 *   parent layout -> child layout
 *   layout -> page/template/loading/error/not-found/default
 *   root layout -> grupos e rotas descendentes
 *
 * - Barrels:
 *   index.ts -> irmãos fonte da pasta
 *
 * - Consumers de barrel:
 *   se alguém usa index.ts, também pode precisar dos arquivos irmãos.
 */

const NEXT_SPECIAL = new Set([
  'layout',
  'page',
  'template',
  'loading',
  'error',
  'not-found',
  'default',
  'route'
]);

function applyHints(files, edges, ctx) {
  const sourceFiles = files.filter(isSourceFile);

  addBarrelHints(sourceFiles, edges);
  addNextAppRouterHints(sourceFiles, edges);
  addFeatureFolderHints(sourceFiles, edges);
  void ctx;
}


function addBarrelHints(files, edges) {
  const byDir = groupByDir(files);

  for (const file of files) {
    if (!isIndexFile(file)) continue;

    const siblings = byDir.get(norm(path.dirname(file))) || [];

    for (const sib of siblings) {
      if (sib !== file && !isNextSpecialFile(sib)) {
        addEdge(edges, file, sib);
      }
    }
  }
}

function addNextAppRouterHints(files, edges) {
  const byDir = groupByDir(files);
  const allLayouts = files.filter(f => baseName(f) === 'layout');

  for (const [, dirFiles] of byDir) {
    const layout = findNamed(dirFiles, 'layout');
    const template = findNamed(dirFiles, 'template');
    const page = findNamed(dirFiles, 'page');
    const loading = findNamed(dirFiles, 'loading');
    const error = findNamed(dirFiles, 'error');
    const notFound = findNamed(dirFiles, 'not-found');
    const defaultFile = findNamed(dirFiles, 'default');
    const route = findNamed(dirFiles, 'route');

    const childrenOfLayout = [
      template,
      page,
      loading,
      error,
      notFound,
      defaultFile
    ];

    for (const child of childrenOfLayout) {
      addEdge(edges, layout, child);
      addEdge(edges, template, child);
    }

    // route.ts é endpoint. Ele é "usado" pelo framework, mas não pela page.
    // Não forçamos route -> page nem page -> route.

    if (layout) {
      const parentLayout = nearestParentLayout(layout, allLayouts);
      addEdge(edges, parentLayout, layout);
    }

    if (page) {
      for (const parentLayout of parentLayoutsFor(page, allLayouts)) {
        addEdge(edges, parentLayout, page);
      }
    }

    if (loading || error || notFound || defaultFile || route) {
      const specials = [loading, error, notFound, defaultFile, route];

      for (const special of specials) {
        for (const parentLayout of parentLayoutsFor(special, allLayouts)) {
          addEdge(edges, parentLayout, special);
        }
      }
    }
  }
}

/**
 * Hints para pastas de feature.
 *
 * Ex:
 * features/auth/index.ts
 * features/auth/components/LoginForm.tsx
 *
 * O index tende a representar a feature.
 */
function addFeatureFolderHints(files, edges) {
  const byDir = groupByDir(files);

  for (const [, dirFiles] of byDir) {
    const indexFile = dirFiles.find(isIndexFile);
    if (!indexFile) continue;

    const dir = path.dirname(indexFile).replace(/\\/g, '/');

    const allowed =
      dir.includes('/features/') ||
      dir.includes('/modules/') ||
      dir.includes('/domains/');

    if (!allowed) continue;

    for (const file of dirFiles) {
      if (file === indexFile) continue;
      if (isNextSpecialFile(file)) continue;

      addEdge(edges, indexFile, file);
    }
  }
}


function groupByDir(files) {
  const map = new Map();

  for (const f of files) {
    const key = norm(path.dirname(f));

    if (!map.has(key)) map.set(key, []);
    map.get(key).push(f);
  }

  return map;
}

function reverseEdges(edges) {
  const r = new Map();

  for (const from in edges) {
    for (const to of edges[from] || []) {
      if (!r.has(to)) r.set(to, []);
      r.get(to).push(from);
    }
  }

  return r;
}

function findNamed(files, name) {
  return files.find(f => baseName(f) === name);
}

function baseName(file) {
  return noExtName(file);
}

function isIndexFile(file) {
  return /^index\.(js|jsx|ts|tsx|mjs|cjs)$/i.test(path.basename(file));
}

function isNextSpecialFile(file) {
  return NEXT_SPECIAL.has(baseName(file));
}

/**
 * Encontra o layout pai mais próximo.
 *
 * Ex:
 * src/app/layout.tsx
 * src/app/(dashboard)/layout.tsx
 *
 * O usado por do layout do dashboard deve incluir o layout raiz.
 */
function nearestParentLayout(layoutFile, allLayouts) {
  const currentDir = path.dirname(layoutFile);
  let best = null;
  let bestLen = -1;

  for (const candidate of allLayouts) {
    if (candidate === layoutFile) continue;

    const dir = path.dirname(candidate);

    if (isParentDir(dir, currentDir) && dir.length > bestLen) {
      best = candidate;
      bestLen = dir.length;
    }
  }

  return best;
}

/**
 * Retorna todos os layouts pais de um arquivo de rota.
 */
function parentLayoutsFor(file, allLayouts) {
  if (!file) return [];

  const fileDir = path.dirname(file);

  return allLayouts
    .filter(layout => {
      const dir = path.dirname(layout);
      return dir === fileDir || isParentDir(dir, fileDir);
    })
    .sort((a, b) => path.dirname(a).length - path.dirname(b).length);
}

function isParentDir(parent, child) {
  const rel = path.relative(parent, child);

  return (
    rel &&
    !rel.startsWith('..') &&
    !path.isAbsolute(rel)
  );
}

module.exports = {
  applyHints
};
