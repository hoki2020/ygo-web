import net from 'node:net';
import process from 'node:process';
import { WebSocket, WebSocketServer } from 'ws';

const WS_HOST = process.env.WS_BRIDGE_HOST || '127.0.0.1';
const WS_PORT = Number(process.env.WS_BRIDGE_PORT || 7912);
const TCP_HOST = process.env.WS_BRIDGE_TARGET_HOST || '127.0.0.1';
const TCP_PORT = Number(process.env.WS_BRIDGE_TARGET_PORT || 7911);

const clients = new Set();

const log = (...args) => {
  const ts = new Date().toISOString();
  console.log(`[ws-bridge ${ts}]`, ...args);
};

const wss = new WebSocketServer({
  host: WS_HOST,
  port: WS_PORT,
  perMessageDeflate: false,
  maxPayload: 16 * 1024 * 1024,
});

wss.on('listening', () => {
  log(`listening on ws://${WS_HOST}:${WS_PORT} -> tcp://${TCP_HOST}:${TCP_PORT}`);
});

wss.on('connection', (ws, req) => {
  const remote = req?.socket?.remoteAddress || 'unknown';
  const tcp = net.createConnection({ host: TCP_HOST, port: TCP_PORT });

  clients.add({ ws, tcp });
  log(`client connected (${remote}), active=${clients.size}`);

  const closePair = (reason) => {
    if (!ws || !tcp) return;
    try {
      if (
        ws.readyState === WebSocket.OPEN ||
        ws.readyState === WebSocket.CONNECTING
      ) {
        ws.close();
      }
    } catch {
      // ignore
    }
    try {
      if (!tcp.destroyed) tcp.destroy();
    } catch {
      // ignore
    }
    clients.forEach((entry) => {
      if (entry.ws === ws || entry.tcp === tcp) clients.delete(entry);
    });
    if (reason) log(`pair closed: ${reason}, active=${clients.size}`);
  };

  tcp.on('connect', () => {
    log(`tcp connected for ${remote}`);
  });

  tcp.on('data', (chunk) => {
    if (ws.readyState !== WebSocket.OPEN) return;
    try {
      ws.send(chunk, { binary: true });
    } catch (error) {
      closePair(`ws send failed: ${error?.message || 'unknown error'}`);
    }
  });

  tcp.on('error', (error) => {
    log(`tcp error for ${remote}: ${error.message}`);
    closePair('tcp error');
  });

  tcp.on('close', () => {
    closePair('tcp closed');
  });

  ws.on('message', (data, isBinary) => {
    if (tcp.destroyed) return;
    try {
      const payload = Buffer.isBuffer(data) ? data : Buffer.from(data);
      tcp.write(payload);
    } catch (error) {
      closePair(`tcp write failed: ${error?.message || 'unknown error'}`);
    }
    if (!isBinary) {
      log(`received text frame from ${remote}, forwarded as bytes`);
    }
  });

  ws.on('error', (error) => {
    log(`ws error for ${remote}: ${error.message}`);
    closePair('ws error');
  });

  ws.on('close', () => {
    closePair('ws closed');
  });
});

wss.on('error', (error) => {
  log(`server error: ${error.message}`);
});

const shutdown = () => {
  log('shutting down...');
  for (const { ws, tcp } of clients) {
    try {
      ws.close();
    } catch {
      // ignore
    }
    try {
      tcp.destroy();
    } catch {
      // ignore
    }
  }
  clients.clear();
  wss.close(() => {
    log('stopped');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
