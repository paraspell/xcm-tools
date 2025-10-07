import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';

import { LiveXcmData, SubscanXcmItem } from './livedata.types';
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

  private ECOSYSTEMS: string[] = ['Polkadot', 'Kusama', 'Westend', 'Paseo'];
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
      void (async () => {
        if (this.clients.size === 0) {
          this.stopPolling();
          return;
        }
        const data = await this.poll().catch((e: Error) => {
          this.printError(e);
          return [];
        });
        for (const item of data) {
          this.server.emit('liveXcmData', item);
        }
      })();
    }, this.INTERVAL);

    this.timer?.unref?.();
  }

  private stopPolling() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  private async poll(): Promise<LiveXcmData[]> {
    const fresh: SubscanXcmItem[] = [];

    for (const ecosystem of this.ECOSYSTEMS) {
      const list = await this.client.fetchLatestXcmList({
        row: this.REQUEST_ROWS,
        ecosystem,
      });
      if (!Array.isArray(list) || list.length === 0) continue;

      for (const item of list) {
        const id = `${item.status}:${item.message_hash}`;
        if (!this.addSeen(id)) continue;

        item.from_chain = ecosystem;
        fresh.push(item);
      }
    }

    return fresh.map((item) => ({
      ecosystem: item.from_chain,
      status: item.status,
      hash: item.message_hash,
      id: item.unique_id,
      originTimestamp: item.origin_block_timestamp,
      confirmTimestamp: item.confirm_block_timestamp,
      from: Number(item.origin_para_id),
      to: Number(item.dest_para_id),
    }));
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
