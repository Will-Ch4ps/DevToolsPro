// dev-tools-hub-pro/src/main/features/bundler/graph/analysis.js

const path = require('path');
const { langForExt } = require('./extractors.js');
const { classifyOrphan } = require('./orphan-classifier.js');

/**
 * Análise do grafo:
 *  - orphans:        arquivos sem importador que são PROVÁVEL código morto
 *  - ignoredOrphans: contagem de sem-importador esperados (config/entrada/framework/test/types)
 *  - core:           arquivos mais importados (o "núcleo" do projeto), por in-degree
 *  - cycles:         grupos em dependência circular (SCC > 1)
 */
function computeAnalysis(files, edges) {
  const indeg = new Map();
  files.forEach(f => indeg.set(f, 0));
  for (const from in edges) {
    for (const to of edges[from]) indeg.set(to, (indeg.get(to) || 0) + 1);
  }

  const isSource = (f) => !!langForExt(path.extname(f).toLowerCase());

  // Sem importador → separa código morto real do que é esperado (config/entrada/framework/…)
  const orphans = [];
  let ignoredOrphans = 0;
  for (const f of files) {
    if (!isSource(f) || (indeg.get(f) || 0) !== 0) continue;
    if (classifyOrphan(f) === 'code') orphans.push(f);
    else ignoredOrphans++;
  }

  const core = files
    .map(f => ({ path: f, count: indeg.get(f) || 0 }))
    .filter(x => x.count > 0)
    .sort((a, b) => b.count - a.count || a.path.localeCompare(b.path))
    .slice(0, 8);

  const cycles = findCycles(files, edges);

  return { orphans, ignoredOrphans, core, cycles };
}

/**
 * Componentes fortemente conexos (Tarjan). Cada componente com mais de um nó
 * representa um ciclo de dependências.
 */
function findCycles(files, edges) {
  const nodes = new Set(files);
  for (const f in edges) { nodes.add(f); edges[f].forEach(t => nodes.add(t)); }

  let index = 0;
  const stack = [];
  const onStack = new Set();
  const idx = new Map();
  const low = new Map();
  const sccs = [];

  const strongconnect = (v) => {
    idx.set(v, index); low.set(v, index); index++;
    stack.push(v); onStack.add(v);

    for (const w of (edges[v] || [])) {
      if (!idx.has(w)) {
        strongconnect(w);
        low.set(v, Math.min(low.get(v), low.get(w)));
      } else if (onStack.has(w)) {
        low.set(v, Math.min(low.get(v), idx.get(w)));
      }
    }

    if (low.get(v) === idx.get(v)) {
      const comp = [];
      let w;
      do { w = stack.pop(); onStack.delete(w); comp.push(w); } while (w !== v);
      if (comp.length > 1) sccs.push(comp);
    }
  };

  for (const v of nodes) if (!idx.has(v)) strongconnect(v);
  return sccs;
}

module.exports = { computeAnalysis };
