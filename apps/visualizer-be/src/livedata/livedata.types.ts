export type SubscanXcmItem = {
  message_hash: string;
  unique_id: string;
  relayed_block_timestamp: number;
  origin_block_timestamp: number;
  confirm_block_timestamp: number;
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

export type LiveXcmData = {
  ecosystem: string;
  status: string;
  hash: string;
  id: string;
  originTimestamp: number;
  confirmTimestamp: number;
  from: number;
  to: number;
};
