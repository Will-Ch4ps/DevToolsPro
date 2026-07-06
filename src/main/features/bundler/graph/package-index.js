// dev-tools-hub-pro/src/main/features/bundler/graph/package-index.js

const path = require('path');
const { norm, readJson, uniq } = require('./utils.js');

function pickExportTarget(value) {
  if (!value) return null;
  if (typeof value === 'string') return value;

  if (Array.isArray(value)) {
    for (const item of value) {
      const picked = pickExportTarget(item);
      if (picked) return picked;
    }
    return null;
  }

  if (typeof value === 'object') {
    const preferred = [
      value.source, value.import, value.module, value.default,
      value.require, value.browser, value.types, value.typings
    ];

    for (const v of preferred) {
      if (typeof v === 'string') return v;
    }

    for (const key of Object.keys(value)) {
      const picked = pickExportTarget(value[key]);
      if (picked) return picked;
    }
  }

  return null;
}

function collectExportEntries(value, add) {
  if (!value) return;

  if (typeof value === 'string') {
    add(value);
    return;
  }

  if (Array.isArray(value)) {
    value.forEach(v => collectExportEntries(v, add));
    return;
  }

  if (typeof value !== 'object') return;

  for (const key of Object.keys(value)) {
    collectExportEntries(value[key], add);
  }
}

function packageEntries(pkg) {
  const out = [];

  const add = (v) => {
    if (typeof v !== 'string') return;
    const clean = v.trim().replace(/^\.\//, '');
    if (clean && clean !== '.') out.push(clean);
  };

  add(pkg.source);
  add(pkg.main);
  add(pkg.module);
  add(pkg.browser);
  add(pkg.types);
  add(pkg.typings);

  collectExportEntries(pkg.exports, add);

  add('src/index.ts');
  add('src/index.tsx');
  add('src/index.js');
  add('src/index.jsx');
  add('index.ts');
  add('index.tsx');
  add('index.js');
  add('index.jsx');

  return uniq(out);
}

async function buildPackageIndex(files) {
  const packageByName = new Map();
  const packageByDir = new Map();

  const packageFiles = files.filter(f => path.basename(f).toLowerCase() === 'package.json');

  await Promise.all(packageFiles.map(async (file) => {
    const pkg = await readJson(file);
    if (!pkg) return;

    const dir = path.dirname(file);
    const meta = {
      dir,
      pkg,
      name: typeof pkg.name === 'string' ? pkg.name : null,
      entries: packageEntries(pkg),
      exports: pkg.exports || null,
      imports: pkg.imports || null
    };

    packageByDir.set(norm(dir), meta);

    if (meta.name) {
      packageByName.set(meta.name, dir);
    }
  }));

  return { packageByName, packageByDir };
}

function splitPackage(spec) {
  const parts = String(spec || '').split('/').filter(Boolean);
  if (!parts.length) return null;

  if (spec.startsWith('@')) {
    if (parts.length < 2) return null;
    return { name: `${parts[0]}/${parts[1]}`, subpath: parts.slice(2).join('/') };
  }

  return { name: parts[0], subpath: parts.slice(1).join('/') };
}

module.exports = {
  buildPackageIndex,
  pickExportTarget,
  splitPackage
};
