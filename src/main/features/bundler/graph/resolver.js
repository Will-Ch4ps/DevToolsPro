// dev-tools-hub-pro/src/main/features/bundler/graph/resolver.js

const path = require('path');
const { RESOLVE_EXTS, INDEX_FILES } = require('./extractors.js');
const { norm, isRelative, cleanSpecifier, matchPattern, applyTarget } = require('./utils.js');
const { pickExportTarget, splitPackage } = require('./package-index.js');

function resolveCandidate(base, lang, ctx) {
  const tries = [base];

  for (const ext of RESOLVE_EXTS[lang] || []) tries.push(base + ext);

  const pkg = ctx.packageByDir.get(norm(base));
  if (pkg) {
    for (const entry of pkg.entries) tries.push(path.join(base, entry));
  }

  for (const idx of INDEX_FILES[lang] || []) tries.push(path.join(base, idx));

  for (const t of tries) {
    const hit = ctx.byNorm.get(norm(path.normalize(t)));
    if (hit) return hit;
  }

  return null;
}

function resolveTsAlias(spec, lang, ctx) {
  for (const rule of ctx.tsAliases) {
    const star = matchPattern(rule.pattern, spec);
    if (star === null) continue;

    for (const target of rule.targets) {
      const mapped = applyTarget(target, star);
      const hit = mapped && resolveCandidate(path.resolve(rule.baseDir, mapped), lang, ctx);
      if (hit) return hit;
    }
  }

  return null;
}

function resolveCommonAlias(spec, lang, ctx) {
  for (const alias of ctx.commonAliases) {
    if (!spec.startsWith(alias.prefix)) continue;

    const rest = spec.slice(alias.prefix.length);
    const hit = resolveCandidate(path.resolve(alias.baseDir, rest), lang, ctx);
    if (hit) return hit;
  }

  return null;
}

function resolveNameAlias(spec, lang, ctx) {
  const parts = spec.split('/').filter(Boolean);
  if (!parts.length) return null;

  const first = parts[0].toLowerCase();
  const rest = parts.slice(1).join('/');
  const alias = ctx.nameAliases.find(a => a.name === first);

  if (!alias) return null;

  for (const dir of alias.dirs) {
    const candidate = rest ? path.join(dir, rest) : dir;
    const hit = resolveCandidate(candidate, lang, ctx);
    if (hit) return hit;
  }

  return null;
}

function resolveExportSubpath(exportsField, subpath) {
  if (!exportsField) return null;

  if (!subpath) {
    if (typeof exportsField === 'string') return exportsField;
    if (exportsField['.']) return pickExportTarget(exportsField['.']);
    return pickExportTarget(exportsField);
  }

  const key = './' + subpath.replace(/^\//, '');

  if (exportsField[key]) return pickExportTarget(exportsField[key]);

  for (const pattern of Object.keys(exportsField || {})) {
    if (!pattern.includes('*')) continue;

    const star = matchPattern(pattern, key);
    if (star === null) continue;

    const target = pickExportTarget(exportsField[pattern]);
    return applyTarget(target, star);
  }

  return null;
}

function guessInternalPackageDir(packageName, ctx) {
  const short = packageName.startsWith('@') ? packageName.split('/')[1] : packageName;
  const scoped = packageName.replace(/^@/, '').replace('/', path.sep);

  const candidates = [
    path.join(ctx.root, 'packages', short),
    path.join(ctx.root, 'packages', scoped),
    path.join(ctx.root, 'apps', short),
    path.join(ctx.root, 'libs', short),
    path.join(ctx.root, 'modules', short)
  ];

  for (const dir of candidates) {
    if (
      ctx.byNorm.has(norm(path.join(dir, 'package.json'))) ||
      ctx.byNorm.has(norm(path.join(dir, 'src', 'index.ts'))) ||
      ctx.byNorm.has(norm(path.join(dir, 'src', 'index.tsx'))) ||
      ctx.byNorm.has(norm(path.join(dir, 'index.ts'))) ||
      ctx.byNorm.has(norm(path.join(dir, 'index.tsx')))
    ) {
      return dir;
    }
  }

  return null;
}

function resolvePackage(spec, lang, ctx) {
  const info = splitPackage(spec);
  if (!info) return null;

  const dir = ctx.packageByName.get(info.name) || guessInternalPackageDir(info.name, ctx);
  if (!dir) return null;

  const meta = ctx.packageByDir.get(norm(dir));

  const exported = resolveExportSubpath(meta?.exports, info.subpath || '');
  if (exported) {
    const hit = resolveCandidate(path.resolve(dir, exported), lang, ctx);
    if (hit) return hit;
  }

  if (!info.subpath) return resolveCandidate(dir, lang, ctx);

  return (
    resolveCandidate(path.resolve(dir, info.subpath), lang, ctx) ||
    resolveCandidate(path.resolve(dir, 'src', info.subpath), lang, ctx)
  );
}

function resolveSpecifier(spec, importer, lang, ctx) {
  const clean = cleanSpecifier(spec);
  if (!clean) return null;

  if (isRelative(clean)) {
    return resolveCandidate(path.resolve(path.dirname(importer), clean), lang, ctx);
  }

  if (lang !== 'js') return null;

  return (
    resolveTsAlias(clean, lang, ctx) ||
    resolveCommonAlias(clean, lang, ctx) ||
    resolvePackage(clean, lang, ctx) ||
    resolveNameAlias(clean, lang, ctx)
  );
}

module.exports = {
  resolveCandidate,
  resolveSpecifier
};
