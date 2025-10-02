/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import type { AxiosInstance } from 'axios';
import axios from 'axios';

export type SubscanXcmItem = {
  message_hash: string;
  unique_id: string;
  relayed_block_timestamp: number;
  status: string;
  from_chain: string;
  origin_para_id: number;
  dest_para_id: number;
};

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
    const url = `https://${params.ecosystem.toLowerCase()}.api.subscan.io`;

    const res = await this.http.post(url + '/api/scan/xcm/list', {
      page: 0,
      row,
    });

    if (res.data?.code !== 0) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      throw new Error(res.data?.message);
    }

    const list = res.data!.data.list as SubscanXcmItem[];
    return list.map((x: SubscanXcmItem) => ({
      message_hash: x.message_hash,
      unique_id: x.unique_id,
      relayed_block_timestamp: x.relayed_block_timestamp,
      status: x.status,
      from_chain: x.from_chain,
      origin_para_id: x.origin_para_id,
      dest_para_id: x.dest_para_id,
    }));
  }
}
