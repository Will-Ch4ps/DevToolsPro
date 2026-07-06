// dev-tools-hub-pro/src/renderer/features/bundler/graph/graph.service.js

const { ipcRenderer } = require('electron');

let cache = { root: null, adj: null, radj: null, stats: null, analysis: null };

export const GraphService = {
  async ensureLoaded(root, files) {
    if (cache.root === root && cache.adj) return { ok: true, stats: cache.stats };

    const res = await ipcRenderer.invoke('bundler:graph', { root, files });
    if (!res || !res.success) return { ok: false, error: res && res.error };

    const adj = res.edges || {};
    cache = {
      root,
      adj,
      radj: reverse(adj),
      stats: res.stats,
      analysis: res.analysis || null
    };

    return { ok: true, stats: res.stats };
  },

  invalidate() {
    cache = { root: null, adj: null, radj: null, stats: null, analysis: null };
  },

  analyze() {
    return cache.analysis;
  },

  directNeighbors(filePath, direction = 'deps') {
    const fwd = cache.adj?.[filePath] || [];
    const back = cache.radj?.[filePath] || [];

    if (direction === 'dependents') return back.slice();
    if (direction === 'both') return [...new Set([...fwd, ...back])];

    return fwd.slice();
  },

  expand(seeds, { direction = 'deps', depth = Infinity } = {}) {
    const wantFwd = direction === 'deps' || direction === 'both';
    const wantBack = direction === 'dependents' || direction === 'both';

    const neighbors = (node) => {
      const out = [];

      if (wantFwd) out.push(...(cache.adj?.[node] || []));
      if (wantBack) out.push(...(cache.radj?.[node] || []));

      return [...new Set(out)];
    };

    const result = new Set(seeds);
    let frontier = [...seeds];
    let level = 0;

    while (frontier.length && level < depth) {
      const next = [];

      for (const node of frontier) {
        for (const n of neighbors(node)) {
          if (!result.has(n)) {
            result.add(n);
            next.push(n);
          }
        }
      }

      frontier = next;
      level++;
    }

    return result;
  }
};

function reverse(adj) {
  const r = {};

  for (const from in adj) {
    for (const to of adj[from] || []) {
      if (!r[to]) r[to] = [];
      r[to].push(from);
    }
  }

  for (const k in r) {
    r[k] = [...new Set(r[k])];
  }

  return r;
}
