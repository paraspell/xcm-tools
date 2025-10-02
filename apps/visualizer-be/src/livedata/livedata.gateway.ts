import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';

import { SubscanXcmItem } from './livedata.types';
import { SubscanClient } from './subscan.client';

@WebSocketGateway({ cors: { origin: true } })
export class LiveDataGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private server!: Server;
  private timer?: NodeJS.Timeout;
  private client = new SubscanClient({
    apiKey: process.env.SUBSCAN_API_KEY,
  });
  private clients = new Set<string>();

  private seen = new Set<string>();
  private seenQueue: string[] = [];

  private ECOSYSTEMS: string[] = ['polkadot', 'kusama', 'westend', 'paseo'];
  private INTERVAL = 5_000; // 5 seconds
  private REQUEST_ROWS = 5;
  private MAX_SIZE = (this.ECOSYSTEMS.length + 1) * this.REQUEST_ROWS;

  afterInit(server: Server) {
    this.server = server;
  }

  handleConnection(client: Socket) {
    this.clients.add(client.id);
    if (this.clients.size > 0) {
      this.startPolling();
    }
  }

  handleDisconnect(client: Socket) {
    this.clients.delete(client.id);
    if (this.clients.size === 0) {
      this.stopPolling();
    }
  }

  private startPolling() {
    if (this.timer) return; // already running

    this.poll().catch((e: Error) => this.printError(e));

    this.timer = setInterval(() => {
      if (this.clients.size === 0) {
        this.stopPolling();
        return;
      }
      this.poll().catch((e: Error) => this.printError(e));
    }, this.INTERVAL);

    this.timer?.unref?.();
  }

  private stopPolling() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  private async poll() {
    const fresh: SubscanXcmItem[] = [];

    for (const ecosystem of this.ECOSYSTEMS) {
      const list = await this.client.fetchLatestXcmList({
        row: this.REQUEST_ROWS,
        ecosystem,
      });
      if (!Array.isArray(list) || list.length === 0) continue;

      // collect only new items
      for (const item of list) {
        const id = `${item.status}:${item.message_hash}`;
        if (this.addSeen(id)) {
          fresh.push(item);
        }
      }
    }

    if (fresh.length === 0) return;

    // emit oldest first
    for (const item of fresh.reverse()) {
      this.server.emit('liveXcmData', {
        ecosystem: item.from_chain,
        status: item.status,
        hash: item.message_hash,
        timestamp: item.relayed_block_timestamp,
        from: item.origin_para_id,
        to: item.dest_para_id,
      });
    }
  }

  private addSeen(id: string): boolean {
    if (this.seen.has(id)) return false;

    this.seen.add(id);
    this.seenQueue.push(id);

    if (this.seenQueue.length > this.MAX_SIZE) {
      const oldest = this.seenQueue.shift();
      this.seen.delete(oldest);
    }
    return true;
  }

  private printError(e: Error) {
    // eslint-disable-next-line no-console
    console.error('[WebSocket] Subscan poll error:', e?.message);
  }

  onModuleDestroy() {
    this.stopPolling();
  }
}
