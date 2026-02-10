/*
 * Socket中间件
 *
 * 所有长连接/Websocket相关的逻辑都应该收敛在这里。
 *
 * */
import { WebSocketStream } from "@/infra";
import { YgoProPacket } from "@/api/ocgcore/ocgAdapter/packet";
import { STOC_GAME_MSG } from "@/api/ocgcore/ocgAdapter/protoDecl";

import handleSocketOpen from "../service/onSocketOpen";

// FIXME: 应该有个返回值，告诉业务方本次请求的结果。比如建立长连接失败。
export function initSocket(initInfo: {
  ip: string;
  player: string;
  passWd: string;
  customOnConnected?: (conn: WebSocketStream) => void;
}): WebSocketStream {
  const { ip, player, passWd, customOnConnected } = initInfo;
  return new WebSocketStream(ip, (conn, _event) => {
    handleSocketOpen(conn, ip, player, passWd);
    customOnConnected && customOnConnected(conn);
  });
}

export function initReplaySocket(replayInfo: {
  url: string; // 提供回放服务的地址
  data: ArrayBuffer; // 回放数据
}): WebSocketStream {
  const { data } = replayInfo;
  return createLocalReplayStream(data);
}

class LocalReplayStream {
  public ws: WebSocket;
  public stream: ReadableStream;
  private packets: ArrayBuffer[];

  constructor(data: ArrayBuffer) {
    this.packets = decodeReplayPackets(data);
    const wsLike = {
      readyState: WebSocket.OPEN,
      binaryType: "arraybuffer",
      send: () => {},
      close: () => {
        wsLike.readyState = WebSocket.CLOSED;
      },
    } as unknown as WebSocket;
    this.ws = wsLike;
    this.stream = new ReadableStream();
  }

  async execute(onMessage: (event: MessageEvent) => Promise<void>) {
    for (const packet of this.packets) {
      if (this.ws.readyState === WebSocket.CLOSED) {
        return;
      }
      await onMessage({ data: packet } as MessageEvent);
    }
    this.close();
  }

  close() {
    this.ws.close();
  }

  isClosed(): boolean {
    return this.ws.readyState === WebSocket.CLOSED;
  }
}

function createLocalReplayStream(data: ArrayBuffer): WebSocketStream {
  return new LocalReplayStream(data) as unknown as WebSocketStream;
}

function decodeReplayPackets(data: ArrayBuffer): ArrayBuffer[] {
  const bytes = new Uint8Array(data);
  const packets: ArrayBuffer[] = [];
  let offset = 0;

  while (offset + 5 <= bytes.byteLength) {
    const msg = bytes[offset];
    const len = new DataView(bytes.buffer, bytes.byteOffset + offset + 1, 4).getUint32(
      0,
      true,
    );
    const payloadStart = offset + 5;
    const payloadEnd = payloadStart + len;
    if (payloadEnd > bytes.byteLength) {
      break;
    }

    const exData = new Uint8Array(1 + len);
    exData[0] = msg;
    exData.set(bytes.slice(payloadStart, payloadEnd), 1);
    const packet = new YgoProPacket(2 + len, STOC_GAME_MSG, exData).serialize();
    packets.push(packet.buffer.slice(packet.byteOffset, packet.byteOffset + packet.byteLength));

    offset = payloadEnd;
  }

  if (packets.length === 0) {
    console.warn("Replay file contains no readable packets.");
  }

  return packets;
}

export function sendSocketData(conn: WebSocketStream, payload: Uint8Array) {
  conn.ws.send(payload);
}

export function closeSocket(conn: WebSocketStream) {
  conn.close();
}
