import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { createServer } from 'node:http';

const HOST = process.env.LOCAL_DATA_HOST || '127.0.0.1';
const PORT = Number(process.env.LOCAL_DATA_PORT || 7913);
const ROOT = path.resolve(process.cwd(), 'server');

const mimeByExt = {
  '.json': 'application/json; charset=utf-8',
  '.conf': 'text/plain; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.cdb': 'application/octet-stream',
};

const send = (res, status, body, type = 'text/plain; charset=utf-8') => {
  res.writeHead(status, {
    'Content-Type': type,
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': '*',
  });
  res.end(body);
};

const server = createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Max-Age': '86400',
    });
    res.end();
    return;
  }

  if (req.method !== 'GET') {
    send(res, 405, 'Method Not Allowed');
    return;
  }

  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  if (!urlPath.startsWith('/local-data/')) {
    send(res, 404, 'Not Found');
    return;
  }

  const filePath = path.resolve(ROOT, `.${urlPath}`);
  if (!filePath.startsWith(ROOT)) {
    send(res, 403, 'Forbidden');
    return;
  }

  let stat;
  try {
    stat = fs.statSync(filePath);
  } catch {
    send(res, 404, 'Not Found');
    return;
  }

  if (!stat.isFile()) {
    send(res, 404, 'Not Found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeByExt[ext] || 'application/octet-stream';
  res.writeHead(200, {
    'Content-Type': contentType,
    'Content-Length': stat.size,
    'Cache-Control': 'no-cache',
    'Access-Control-Allow-Origin': '*',
  });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, HOST, () => {
  console.log(`[local-data] serving ${ROOT} at http://${HOST}:${PORT}/local-data/`);
});
