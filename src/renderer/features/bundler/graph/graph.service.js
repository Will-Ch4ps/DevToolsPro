// dev-tools-hub-pro/src/renderer/features/bundler/graph/graph.service.js

const { ipcRenderer } = require('electron');

/**
 * Serviço do grafo de dependências no renderer.
 * Carrega o grafo (via IPC/motor no main) e faz travessia transitiva.
 * As chaves/arestas usam os mesmos caminhos absolutos da árvore, então dá
 * pra mapear direto para os nós selecionados.
 */
let cache = { root: null, adj: null, radj: null, stats: null };

export const GraphService = {
  async ensureLoaded(root, files) {
    if (cache.root === root && cache.adj) return { ok: true, stats: cache.stats };

    const res = await ipcRenderer.invoke('bundler:graph', { root, files });
    if (!res || !res.success) return { ok: false, error: res && res.error };

    const adj = res.edges || {};
    cache = { root, adj, radj: reverse(adj), stats: res.stats };
    return { ok: true, stats: res.stats };
  },

  invalidate() {
    cache = { root: null, adj: null, radj: null, stats: null };
  },

  /**
   * Expande a partir de seeds respeitando direção e alcance.
   * direction: 'deps' (o que importa) | 'dependents' (quem importa) | 'both'
   * depth: número de níveis (1 = vizinhos diretos) ou Infinity (transitivo)
   * Retorna um Set com os seeds + os alcançados.
   */
  expand(seeds, { direction = 'deps', depth = Infinity } = {}) {
    const wantFwd = direction === 'deps' || direction === 'both';
    const wantBack = direction === 'dependents' || direction === 'both';

    const neighbors = (node) => {
      let out = [];
      if (wantFwd && cache.adj) out = out.concat(cache.adj[node] || []);
      if (wantBack && cache.radj) out = out.concat(cache.radj[node] || []);
      return out;
    };

    const result = new Set(seeds);
    let frontier = [...seeds];
    let level = 0;

    while (frontier.length && level < depth) {
      const next = [];
      for (const node of frontier) {
        for (const n of neighbors(node)) {
          if (!result.has(n)) { result.add(n); next.push(n); }
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
    for (const to of adj[from]) {
      (r[to] = r[to] || []).push(from);
    }
  }
  return r;
}
