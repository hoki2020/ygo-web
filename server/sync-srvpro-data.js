import fs from 'node:fs';
import path from 'node:path';

const defaultRoot =
  process.platform === 'win32'
    ? 'D:/docker-data/ygopro-server'
    : path.resolve(process.cwd(), 'docker-data/ygopro-server');

const root = process.env.SRVPRO_DATA_ROOT
  ? process.env.SRVPRO_DATA_ROOT.replaceAll(String.fromCharCode(92), '/')
  : defaultRoot;

const sourceRoot = path.resolve(process.cwd(), 'server/local-data');
const targetRoot = path.join(root, 'expansions');
const sourceScriptRoot = path.join(sourceRoot, 'script');
const targetScriptRoot = path.join(targetRoot, 'script');

if (!fs.existsSync(sourceRoot)) {
  console.error('[srvpro-sync] source not found: ' + sourceRoot);
  process.exit(1);
}

fs.mkdirSync(targetRoot, { recursive: true });

const files = fs
  .readdirSync(sourceRoot, { withFileTypes: true })
  .filter((entry) => entry.isFile())
  .map((entry) => entry.name)
  .filter((name) => /\.(cdb|conf)$/i.test(name));

if (files.length === 0) {
  console.warn('[srvpro-sync] no .cdb or .conf files found in ' + sourceRoot);
  process.exit(0);
}

for (const file of files) {
  const from = path.join(sourceRoot, file);
  const to = path.join(targetRoot, file);
  fs.copyFileSync(from, to);
  console.log('[srvpro-sync] copied: ' + from + ' -> ' + to);
}

const copyDirRecursive = (fromDir, toDir) => {
  fs.mkdirSync(toDir, { recursive: true });
  for (const entry of fs.readdirSync(fromDir, { withFileTypes: true })) {
    const fromPath = path.join(fromDir, entry.name);
    const toPath = path.join(toDir, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(fromPath, toPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(fromPath, toPath);
    }
  }
};

if (fs.existsSync(sourceScriptRoot) && fs.statSync(sourceScriptRoot).isDirectory()) {
  copyDirRecursive(sourceScriptRoot, targetScriptRoot);
  console.log('[srvpro-sync] synced script dir: ' + sourceScriptRoot + ' -> ' + targetScriptRoot);
} else {
  console.warn('[srvpro-sync] script dir not found, skipped: ' + sourceScriptRoot);
}

console.log('[srvpro-sync] done. target: ' + targetRoot);
