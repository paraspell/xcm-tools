export type ChannelResult = {
  id: string;
  ecosystem: string;
  senderId: string;
  recipientId: string;
  transferCount: string;
  totalCount: string;
};

export type ParaIdAssetCountResult = {
  ecosystem: string;
  origin_para_id: number;
  symbol: string;
  count: string;
  amount: string;
};

export type AssetCountResult = {
  ecosystem: string;
  symbol: string;
  count: string;
  amount: string;
};

export type AccountXcmCountResult = {
  ecosystem: string;
  from_account_id: string;
  message_count: string;
};

export type XcmTransferData = {
  ecosystem: string;
  message_hash: string;
  unique_id: string;
};

export enum CountOption {
  ORIGIN = 'origin_para_id',
  DESTINATION = 'dest_para_id',
  BOTH = 'both',
}
