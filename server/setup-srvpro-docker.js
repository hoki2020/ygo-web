import fs from 'node:fs';
import path from 'node:path';

const defaultRoot = process.platform === 'win32' ? 'D:/docker-data/ygopro-server' : path.resolve(process.cwd(), 'docker-data/ygopro-server');
const root = process.env.SRVPRO_DATA_ROOT ? process.env.SRVPRO_DATA_ROOT.replaceAll(String.fromCharCode(92), '/') : defaultRoot;
const dirs = ['config', 'expansions', 'expansions/script', 'replays', 'decks'];

for (const d of dirs) {
  fs.mkdirSync(path.join(root, d), { recursive: true });
}

const templatePath = path.resolve(process.cwd(), 'docker/srvpro/config.json');
const targetPath = path.join(root, 'config', 'config.json');
if (!fs.existsSync(templatePath)) {
  console.error('[srvpro-docker] missing template: ' + templatePath);
  process.exit(1);
}
if (!fs.existsSync(targetPath)) {
  fs.copyFileSync(templatePath, targetPath);
  console.log('[srvpro-docker] created config: ' + targetPath);
} else {
  console.log('[srvpro-docker] config exists: ' + targetPath);
}

console.log('[srvpro-docker] data root: ' + root);
console.log('[srvpro-docker] make sure Docker Desktop disk image is on D drive if you want zero C usage.');
