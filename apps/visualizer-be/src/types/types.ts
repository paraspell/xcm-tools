export type ChannelResult = {
  id: string;
  senderId: string;
  recipientId: string;
  totalCount: string;
};

export type ParaIdAssetCountResult = {
  origin_para_id: number;
  symbol: string;
  count: string;
};

export type AssetCountResult = {
  symbol: string;
  count: string;
};

export type AccountXcmCountResult = {
  from_account_id: string;
  message_count: string;
};

export type XcmTransferData = {
  message_hash: string;
  unique_id: string;
};
