// dev-tools-hub-pro/src/main/features/bundler/graph/index.js

const fs = require('fs/promises');
const path = require('path');

const {
  langForExt,
  extractSpecifiers,
  normalizeSpecifier
} = require('./extractors.js');

const { computeAnalysis } = require('./analysis.js');
const { buildFileMaps, slash, uniq } = require('./utils.js');
const { buildPackageIndex } = require('./package-index.js');
const { buildTsAliases, buildCommonAliases, buildNameAliases } = require('./aliases.js');
const { resolveSpecifier } = require('./resolver.js');
const { applyHints } = require('./hints.js');

async function buildContext(root, files) {
  const { byNorm, byDir, byBase } = buildFileMaps(files);
  const { packageByName, packageByDir } = await buildPackageIndex(files);
  const tsAliases = await buildTsAliases(root, files);
  const commonAliases = buildCommonAliases(root, files);
  const nameAliases = buildNameAliases(root, files);

  return {
    root,
    byNorm,
    byDir,
    byBase,
    packageByName,
    packageByDir,
    tsAliases,
    commonAliases,
    nameAliases
  };
}

async function parseFile(file, ctx) {
  const lang = langForExt(path.extname(file).toLowerCase());
  if (!lang) return null;

  let content;

  try {
    content = await fs.readFile(file, 'utf8');
  } catch {
    return null;
  }

  if (content.includes('\0')) return null;

  const targets = new Set();

  for (const raw of extractSpecifiers(content, lang)) {
    const spec = normalizeSpecifier(raw, lang);
    if (!spec) continue;

    const resolved = resolveSpecifier(spec, file, lang, ctx);
    if (resolved && resolved !== file) targets.add(resolved);
  }

  return {
    parsed: true,
    targets: [...targets]
  };
}

async function buildGraph({ root, files }) {
  try {
    const list = Array.isArray(files) ? files : [];
    const ctx = await buildContext(root, list);

    const edges = {};
    let parsed = 0;

    await Promise.all(list.map(async (file) => {
      const result = await parseFile(file, ctx);
      if (!result) return;

      parsed++;

      if (result.targets.length) {
        edges[file] = result.targets;
      }
    }));

    applyHints(list, edges, ctx);

    let edgeCount = 0;

    for (const from in edges) {
      edges[from] = uniq(edges[from])
        .filter(to => to && to !== from)
        .sort((a, b) => slash(a).localeCompare(slash(b)));

      edgeCount += edges[from].length;
    }

    const analysis = computeAnalysis(list, edges);

    return {
      success: true,
      edges,
      analysis,
      stats: {
        files: list.length,
        parsed,
        edges: edgeCount,
        packages: ctx.packageByName.size,
        tsAliases: ctx.tsAliases.length,
        commonAliases: ctx.commonAliases.length,
        nameAliases: ctx.nameAliases.length
      }
    };
  } catch (e) {
    return {
      success: false,
      error: e.message
    };
  }
}

module.exports = { buildGraph };
