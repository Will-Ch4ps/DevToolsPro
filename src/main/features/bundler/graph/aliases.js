// dev-tools-hub-pro/src/main/features/bundler/graph/aliases.js

const path = require('path');
const { norm, slash, readJson } = require('./utils.js');

async function buildTsAliases(root, files) {
  const aliases = [];
  const configNames = new Set(['tsconfig.json', 'jsconfig.json', 'tsconfig.base.json']);

  const configFiles = files.filter(f => configNames.has(path.basename(f).toLowerCase()));

  for (const name of configNames) {
    const p = path.join(root, name);
    if (!configFiles.some(f => norm(f) === norm(p))) configFiles.push(p);
  }

  await Promise.all(configFiles.map(async (file) => {
    const cfg = await readJson(file);
    if (!cfg?.compilerOptions) return;

    const dir = path.dirname(file);
    const baseUrl = path.resolve(dir, cfg.compilerOptions.baseUrl || '.');
    const paths = cfg.compilerOptions.paths || {};

    for (const pattern of Object.keys(paths)) {
      const targets = Array.isArray(paths[pattern]) ? paths[pattern] : [];
      aliases.push({ pattern, targets, baseDir: baseUrl });
    }
  }));

  return aliases;
}

function buildCommonAliases(root, files) {
  const srcDirs = new Set();

  for (const f of files) {
    const rel = slash(path.relative(root, f));
    const parts = rel.split('/');

    for (let i = 0; i < parts.length; i++) {
      if (parts[i] === 'src') {
        srcDirs.add(path.join(root, parts.slice(0, i + 1).join('/')));
      }
    }
  }

  srcDirs.add(path.join(root, 'src'));

  const aliases = [];
  for (const srcDir of srcDirs) {
    aliases.push({ prefix: '@/', baseDir: srcDir });
    aliases.push({ prefix: '~/', baseDir: srcDir });
    aliases.push({ prefix: '#/', baseDir: srcDir });
  }

  return aliases;
}

function buildNameAliases(root, files) {
  const aliases = [];
  const folders = new Map();

  for (const file of files) {
    const parts = slash(path.relative(root, file)).split('/');

    for (let i = 0; i < parts.length - 1; i++) {
      const name = parts[i];
      if (!name || name === 'src' || name.startsWith('(')) continue;

      const abs = path.join(root, ...parts.slice(0, i + 1));
      if (!folders.has(name.toLowerCase())) folders.set(name.toLowerCase(), new Set());

      folders.get(name.toLowerCase()).add(abs);
    }
  }

  for (const [name, dirs] of folders) {
    aliases.push({ name, dirs: [...dirs] });
  }

  return aliases;
}

module.exports = {
  buildTsAliases,
  buildCommonAliases,
  buildNameAliases
};
