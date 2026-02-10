import { spawnSync } from 'node:child_process';
import process from 'node:process';

const composeFile = 'docker-compose.srvpro.yml';
const sub = process.argv[2] || 'up';

const dockerCandidates = [
  process.env.DOCKER_BIN,
  'docker',
  'C:/Program Files/Docker/Docker/resources/bin/docker.exe',
].filter(Boolean);

const dockerBinDir = 'C:/Program Files/Docker/Docker/resources/bin';
const runEnv = { ...process.env, PATH: process.env.PATH ? `${dockerBinDir};${process.env.PATH}` : dockerBinDir };

const run = (cmd, args) => spawnSync(cmd, args, { stdio: 'inherit', shell: false, env: runEnv });

const tryDockerCompose = () => {
  for (const cmd of dockerCandidates) {
    const check = run(cmd, ['compose', 'version']);
    if (check.status === 0) return cmd;
  }
  return null;
};

const tryLegacyCompose = () => {
  const legacyCandidates = [
    process.env.DOCKER_COMPOSE_BIN,
    'docker-compose',
    'C:/Program Files/Docker/Docker/resources/bin/docker-compose.exe',
  ].filter(Boolean);
  for (const cmd of legacyCandidates) {
    const check = run(cmd, ['version']);
    if (check.status === 0) return cmd;
  }
  return null;
};

const dockerCmd = tryDockerCompose();
const isLogs = sub === 'logs';
const argsBySub = {
  up: ['-f', composeFile, 'up', '-d'],
  down: ['-f', composeFile, 'down'],
  logs: ['-f', composeFile, 'logs', '-f', 'srvpro'],
};

if (!argsBySub[sub]) {
  console.error('[srvpro-docker] unknown subcommand:', sub);
  process.exit(2);
}

if (dockerCmd) {
  const r = run(dockerCmd, ['compose', ...argsBySub[sub]]);
  process.exit(r.status ?? 1);
}

const legacy = tryLegacyCompose();
if (legacy) {
  const r = run(legacy, argsBySub[sub]);
  process.exit(r.status ?? 1);
}

console.error('[srvpro-docker] Docker CLI not found.');
console.error('[srvpro-docker] Try opening Docker Desktop once, or set DOCKER_BIN to docker.exe path.');
process.exit(1);
