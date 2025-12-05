import type { AxiosInstance } from 'axios';
import axios from 'axios';

import type { SubscanResponse, SubscanXcmItem } from './livedata.types.js';

export class SubscanClient {
  private http: AxiosInstance;
  constructor(opts?: { apiKey?: string }) {
    this.http = axios.create({
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(opts?.apiKey ? { 'X-API-Key': opts.apiKey } : {}),
      },
    });
  }

  async fetchLatestXcmList(params?: {
    row?: number;
    ecosystem: string;
  }): Promise<SubscanXcmItem[]> {
    const row = params?.row ?? 20;
    const url = `https://${params?.ecosystem.toLowerCase()}.api.subscan.io`;

    const res = await this.http.post(url + '/api/scan/xcm/list', {
      page: 0,
      row,
    });
    const data = res.data as SubscanResponse;

    if (data?.code !== 0) {
      throw new Error(data?.message);
    }

    const list = data.data.list;
    return list.map((x: SubscanXcmItem) => ({
      message_hash: x.message_hash,
      unique_id: x.unique_id,
      relayed_block_timestamp: x.relayed_block_timestamp,
      origin_block_timestamp: x.origin_block_timestamp,
      confirm_block_timestamp: x.confirm_block_timestamp,
      status: x.status,
      from_chain: x.from_chain,
      origin_para_id: x.origin_para_id,
      dest_para_id: x.dest_para_id,
    }));
  }
}
