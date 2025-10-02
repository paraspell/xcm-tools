export type SubscanXcmItem = {
  message_hash: string;
  unique_id: string;
  relayed_block_timestamp: number;
  status: string;
  from_chain: string;
  origin_para_id: number;
  dest_para_id: number;
};

export type SubscanResponse = {
  data: {
    list: SubscanXcmItem[];
  };
  code: number;
  message: string;
};
