// dev-tools-hub-pro/src/renderer/features/bundler/handlers/graph.handlers.js

import { state } from '../state.js';
import { BundlerView } from '../bundler.view.js';
import { GraphService } from '../graph/index.js';
import { collectFilePaths, findNodeByPath } from '../lib/tree-utils.js';
import { toggleNode, updateStats, setDerived } from './selection.handlers.js';

/**
 * Garante o grafo carregado para o projeto atual (só local/WSL por enquanto).
 * Retorna { ok, reason }.
 */
async function ensureGraph() {
  if (!state.structure) return { ok: false, reason: 'no-project' };
  if (state.isRemoteMode) return { ok: false, reason: 'remote' };

  const set = new Set();
  collectFilePaths(state.structure, set);
  const res = await GraphService.ensureLoaded(state.rootPath, [...set]);
  return { ok: res.ok, reason: res.ok ? null : 'error' };
}

function normDepth(depth) {
  return depth === 'all' ? Infinity : (Number(depth) || 1);
}

/**
 * Preview (não altera seleção): quantos arquivos seriam adicionados.
 * Retorna { ok, added, total } ou { ok:false, reason }.
 */
export async function previewDependencies({ direction = 'deps', depth = 1 } = {}) {
  const seeds = [...state.selectedPaths];
  if (seeds.length === 0) return { ok: false, reason: 'empty' };

  const g = await ensureGraph();
  if (!g.ok) return { ok: false, reason: g.reason };

  const full = GraphService.expand(seeds, { direction, depth: normDepth(depth) });
  const addedPaths = [...full].filter(p => !state.selectedPaths.has(p));
  const addedTokens = estimateTokens(addedPaths);

  return { ok: true, added: addedPaths.length, total: full.size, addedTokens };
}

/** Carrega o grafo e devolve a análise do projeto (órfãos/núcleo/ciclos). */
export async function getAnalysis() {
  const g = await ensureGraph();
  if (!g.ok) return { ok: false, reason: g.reason };
  return { ok: true, analysis: GraphService.analyze() };
}

/** Ligações diretas de um arquivo: o que ele usa e quem o usa. */
export async function getFileLinks(filePath) {
  const g = await ensureGraph();
  if (!g.ok) return { ok: false, reason: g.reason };
  return {
    ok: true,
    uses: GraphService.directNeighbors(filePath, 'deps'),
    usedBy: GraphService.directNeighbors(filePath, 'dependents')
  };
}

/** Abre o inspetor de ligações de um arquivo e destaca os vizinhos na árvore. */
export async function handleInspect(filePath, rect) {
  const links = await getFileLinks(filePath);
  if (!links.ok) return;
  BundlerView.openInspector({ filePath, uses: links.uses, usedBy: links.usedBy, rect });
}

/** Seleciona um conjunto de caminhos (usado pela análise e pelo inspetor). */
export function selectPaths(paths) {
  if (!Array.isArray(paths) || !paths.length) return;
  for (const p of paths) {
    const node = findNodeByPath(state.structure, p);
    if (node && !node._checked) toggleNode(node, true);
  }
  updateStats();
  BundlerView.revealSelected();
}

// Estima tokens (mesma base do painel de status: ~3.5 bytes/token)
function estimateTokens(paths) {
  let bytes = 0;
  for (const p of paths) {
    const node = findNodeByPath(state.structure, p);
    if (node && node.type === 'file') bytes += node.size || 0;
  }
  return Math.ceil(bytes / 3.5);
}

/**
 * Aplica: expande a seleção pelas ligações escolhidas.
 */
export async function handleExpandDependencies({ direction = 'deps', depth = 1 } = {}) {
  const seeds = [...state.selectedPaths];
  if (seeds.length === 0) {
    alert('Selecione ao menos um arquivo primeiro — o sistema puxa o que estiver ligado a ele.');
    return;
  }

  const g = await ensureGraph();
  if (!g.ok) {
    alert(g.reason === 'remote'
      ? 'Análise de dependências disponível apenas em projetos locais/WSL por enquanto.'
      : 'Não foi possível analisar as dependências.');
    return;
  }

  const full = GraphService.expand(seeds, { direction, depth: normDepth(depth) });
  for (const p of full) {
    const node = findNodeByPath(state.structure, p);
    if (node && !node._checked) {
      toggleNode(node, true);
      setDerived(node, true); // veio por dependência, não escolha direta
    }
  }

  updateStats();
  BundlerView.revealSelected();
}
