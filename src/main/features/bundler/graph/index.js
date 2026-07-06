// dev-tools-hub-pro/src/main/features/bundler/graph/index.js

const fs = require('fs/promises');
const path = require('path');
const {
  RESOLVE_EXTS,
  INDEX_FILES,
  langForExt,
  extractSpecifiers,
  normalizeSpecifier
} = require('./extractors.js');

/**
 * Motor de dependências (determinístico, sem IA).
 * Lê os arquivos, extrai os imports, resolve cada um para um arquivo do projeto
 * e devolve um grafo de arestas "quem importa quem".
 *
 * As arestas usam os MESMOS caminhos absolutos que a árvore/seleção do renderer,
 * então o front consegue mapear direto para os nós selecionados.
 */

// Forma canônica p/ comparar caminhos no Windows (separadores + caixa).
const norm = (p) => p.replace(/\\/g, '/').toLowerCase();

function resolveSpecifier(relPath, importerAbs, lang, byNorm) {
  const baseDir = path.dirname(importerAbs);
  const candidateBase = path.resolve(baseDir, relPath);

  const tries = [candidateBase];
  for (const ext of (RESOLVE_EXTS[lang] || [])) tries.push(candidateBase + ext);
  for (const idx of (INDEX_FILES[lang] || [])) tries.push(path.join(candidateBase, idx));

  for (const t of tries) {
    const hit = byNorm.get(norm(t));
    if (hit) return hit;
  }
  return null;
}

async function buildGraph({ root, files }) {
  try {
    const list = Array.isArray(files) ? files : [];
    const byNorm = new Map();
    for (const f of list) byNorm.set(norm(f), f);

    const edges = {};
    let parsed = 0;
    let edgeCount = 0;

    await Promise.all(list.map(async (file) => {
      const lang = langForExt(path.extname(file).toLowerCase());
      if (!lang) return;

      let content;
      try { content = await fs.readFile(file, 'utf8'); } catch { return; }
      if (content.includes('\0')) return; // binário

      parsed++;

      const targets = new Set();
      for (const spec of extractSpecifiers(content, lang)) {
        const rel = normalizeSpecifier(spec, lang);
        if (!rel) continue;
        const resolved = resolveSpecifier(rel, file, lang, byNorm);
        if (resolved && resolved !== file) targets.add(resolved);
      }

      if (targets.size) {
        edges[file] = [...targets];
        edgeCount += targets.size;
      }
    }));

    return { success: true, edges, stats: { files: list.length, parsed, edges: edgeCount } };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

module.exports = { buildGraph };
