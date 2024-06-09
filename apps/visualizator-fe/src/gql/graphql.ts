/* eslint-disable */
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** `Date` type as integer. Type represents date and time as number of milliseconds from start of UNIX epoch. */
  Timestamp: { input: any; output: any; }
};

export type AccountXcmCountType = {
  __typename?: 'AccountXcmCountType';
  count: Scalars['Int']['output'];
  id: Scalars['String']['output'];
};

export type Asset = {
  __typename?: 'Asset';
  amount: Scalars['String']['output'];
  asset_module: Scalars['String']['output'];
  decimals: Scalars['Int']['output'];
  enum_key: Scalars['String']['output'];
  symbol: Scalars['String']['output'];
};

export type AssetCount = {
  __typename?: 'AssetCount';
  count: Scalars['Int']['output'];
  paraId?: Maybe<Scalars['Int']['output']>;
  symbol: Scalars['String']['output'];
};

export type Channel = {
  __typename?: 'Channel';
  active_at: Scalars['Int']['output'];
  id: Scalars['Int']['output'];
  message_count: Scalars['Int']['output'];
  proposed_max_capacity: Scalars['Int']['output'];
  proposed_max_message_size: Scalars['Int']['output'];
  recipient: Scalars['Int']['output'];
  sender: Scalars['Int']['output'];
  status: Scalars['String']['output'];
  transfer_count: Scalars['Int']['output'];
};

/** Option to count messages by origin, destination, or both */
export enum CountOption {
  BOTH = 'BOTH',
  DESTINATION = 'DESTINATION',
  ORIGIN = 'ORIGIN'
}

export type Message = {
  __typename?: 'Message';
  assets: Array<Asset>;
  block_num: Scalars['Int']['output'];
  child_dest?: Maybe<Scalars['String']['output']>;
  child_para_id: Scalars['Int']['output'];
  confirm_block_timestamp: Scalars['Int']['output'];
  dest_event_index: Scalars['String']['output'];
  dest_extrinsic_index: Scalars['String']['output'];
  dest_para_id: Scalars['Int']['output'];
  extrinsic_index: Scalars['String']['output'];
  from_account_id: Scalars['String']['output'];
  message_hash: Scalars['ID']['output'];
  message_type: Scalars['String']['output'];
  origin_block_timestamp: Scalars['Int']['output'];
  origin_event_index: Scalars['String']['output'];
  origin_para_id: Scalars['Int']['output'];
  protocol: Scalars['String']['output'];
  relayed_block_timestamp: Scalars['Int']['output'];
  relayed_event_index: Scalars['String']['output'];
  relayed_extrinsic_index: Scalars['String']['output'];
  status: Scalars['String']['output'];
  to_account_id: Scalars['String']['output'];
  unique_id: Scalars['String']['output'];
  xcm_version: Scalars['Int']['output'];
};

export type MessageCount = {
  __typename?: 'MessageCount';
  paraId: Scalars['Int']['output'];
  totalCount: Scalars['Int']['output'];
};

export type MessageCountByDay = {
  __typename?: 'MessageCountByDay';
  date: Scalars['String']['output'];
  messageCount: Scalars['Float']['output'];
  messageCountFailed: Scalars['Float']['output'];
  messageCountSuccess: Scalars['Float']['output'];
  paraId?: Maybe<Scalars['Int']['output']>;
};

export type MessageCountByStatus = {
  __typename?: 'MessageCountByStatus';
  failed: Scalars['Int']['output'];
  paraId?: Maybe<Scalars['Int']['output']>;
  success: Scalars['Int']['output'];
};

export type Query = {
  __typename?: 'Query';
  accountCounts: Array<AccountXcmCountType>;
  assetCountsBySymbol: Array<AssetCount>;
  channel: Channel;
  channels: Array<Channel>;
  message: Message;
  messageCounts: Array<MessageCountByStatus>;
  messageCountsByDay: Array<MessageCountByDay>;
  messages: Array<Message>;
  totalMessageCounts: Array<MessageCount>;
};


export type QueryAccountCountsArgs = {
  endTime: Scalars['Timestamp']['input'];
  paraIds?: InputMaybe<Array<Scalars['Int']['input']>>;
  startTime: Scalars['Timestamp']['input'];
  threshold: Scalars['Int']['input'];
};


export type QueryAssetCountsBySymbolArgs = {
  endTime: Scalars['Timestamp']['input'];
  paraIds?: InputMaybe<Array<Scalars['Int']['input']>>;
  startTime: Scalars['Timestamp']['input'];
};


export type QueryChannelArgs = {
  id: Scalars['Int']['input'];
};


export type QueryChannelsArgs = {
  endTime: Scalars['Timestamp']['input'];
  startTime: Scalars['Timestamp']['input'];
};


export type QueryMessageArgs = {
  message_hash: Scalars['String']['input'];
};


export type QueryMessageCountsArgs = {
  endTime: Scalars['Timestamp']['input'];
  paraIds?: InputMaybe<Array<Scalars['Int']['input']>>;
  startTime: Scalars['Timestamp']['input'];
};


export type QueryMessageCountsByDayArgs = {
  endTime: Scalars['Timestamp']['input'];
  paraIds?: InputMaybe<Array<Scalars['Int']['input']>>;
  startTime: Scalars['Timestamp']['input'];
};


export type QueryTotalMessageCountsArgs = {
  countBy?: CountOption;
  endTime: Scalars['Timestamp']['input'];
  startTime: Scalars['Timestamp']['input'];
};

export type ChannelsQueryVariables = Exact<{
  startTime: Scalars['Timestamp']['input'];
  endTime: Scalars['Timestamp']['input'];
}>;


export type ChannelsQuery = { __typename?: 'Query', channels: Array<{ __typename?: 'Channel', id: number, sender: number, recipient: number, message_count: number }> };

export type ChannelQueryVariables = Exact<{
  id: Scalars['Int']['input'];
}>;


export type ChannelQuery = { __typename?: 'Query', channel: { __typename?: 'Channel', id: number, sender: number, recipient: number, message_count: number } };

export type MessageCountsQueryVariables = Exact<{
  paraIds?: InputMaybe<Array<Scalars['Int']['input']> | Scalars['Int']['input']>;
  startTime: Scalars['Timestamp']['input'];
  endTime: Scalars['Timestamp']['input'];
}>;


export type MessageCountsQuery = { __typename?: 'Query', messageCounts: Array<{ __typename?: 'MessageCountByStatus', paraId?: number | null, success: number, failed: number }> };

export type MessageCountsByDayQueryVariables = Exact<{
  paraIds?: InputMaybe<Array<Scalars['Int']['input']> | Scalars['Int']['input']>;
  startTime: Scalars['Timestamp']['input'];
  endTime: Scalars['Timestamp']['input'];
}>;


export type MessageCountsByDayQuery = { __typename?: 'Query', messageCountsByDay: Array<{ __typename?: 'MessageCountByDay', paraId?: number | null, date: string, messageCount: number, messageCountSuccess: number, messageCountFailed: number }> };

export type AssetCountsBySymbolQueryVariables = Exact<{
  paraIds?: InputMaybe<Array<Scalars['Int']['input']> | Scalars['Int']['input']>;
  startTime: Scalars['Timestamp']['input'];
  endTime: Scalars['Timestamp']['input'];
}>;


export type AssetCountsBySymbolQuery = { __typename?: 'Query', assetCountsBySymbol: Array<{ __typename?: 'AssetCount', paraId?: number | null, symbol: string, count: number }> };

export type AccountCountsQueryVariables = Exact<{
  threshold: Scalars['Int']['input'];
  paraIds?: InputMaybe<Array<Scalars['Int']['input']> | Scalars['Int']['input']>;
  startTime: Scalars['Timestamp']['input'];
  endTime: Scalars['Timestamp']['input'];
}>;


export type AccountCountsQuery = { __typename?: 'Query', accountCounts: Array<{ __typename?: 'AccountXcmCountType', id: string, count: number }> };

export type TotalMessageCountsQueryVariables = Exact<{
  startTime: Scalars['Timestamp']['input'];
  endTime: Scalars['Timestamp']['input'];
  countBy: CountOption;
}>;


export type TotalMessageCountsQuery = { __typename?: 'Query', totalMessageCounts: Array<{ __typename?: 'MessageCount', paraId: number, totalCount: number }> };


export const ChannelsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"channels"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"startTime"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Timestamp"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"endTime"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Timestamp"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"channels"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"startTime"},"value":{"kind":"Variable","name":{"kind":"Name","value":"startTime"}}},{"kind":"Argument","name":{"kind":"Name","value":"endTime"},"value":{"kind":"Variable","name":{"kind":"Name","value":"endTime"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"sender"}},{"kind":"Field","name":{"kind":"Name","value":"recipient"}},{"kind":"Field","name":{"kind":"Name","value":"message_count"}}]}}]}}]} as unknown as DocumentNode<ChannelsQuery, ChannelsQueryVariables>;
export const ChannelDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"channel"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"channel"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"sender"}},{"kind":"Field","name":{"kind":"Name","value":"recipient"}},{"kind":"Field","name":{"kind":"Name","value":"message_count"}}]}}]}}]} as unknown as DocumentNode<ChannelQuery, ChannelQueryVariables>;
export const MessageCountsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"messageCounts"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paraIds"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"startTime"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Timestamp"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"endTime"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Timestamp"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"messageCounts"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"paraIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paraIds"}}},{"kind":"Argument","name":{"kind":"Name","value":"startTime"},"value":{"kind":"Variable","name":{"kind":"Name","value":"startTime"}}},{"kind":"Argument","name":{"kind":"Name","value":"endTime"},"value":{"kind":"Variable","name":{"kind":"Name","value":"endTime"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"paraId"}},{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"failed"}}]}}]}}]} as unknown as DocumentNode<MessageCountsQuery, MessageCountsQueryVariables>;
export const MessageCountsByDayDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"messageCountsByDay"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paraIds"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"startTime"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Timestamp"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"endTime"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Timestamp"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"messageCountsByDay"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"paraIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paraIds"}}},{"kind":"Argument","name":{"kind":"Name","value":"startTime"},"value":{"kind":"Variable","name":{"kind":"Name","value":"startTime"}}},{"kind":"Argument","name":{"kind":"Name","value":"endTime"},"value":{"kind":"Variable","name":{"kind":"Name","value":"endTime"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"paraId"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"messageCount"}},{"kind":"Field","name":{"kind":"Name","value":"messageCountSuccess"}},{"kind":"Field","name":{"kind":"Name","value":"messageCountFailed"}}]}}]}}]} as unknown as DocumentNode<MessageCountsByDayQuery, MessageCountsByDayQueryVariables>;
export const AssetCountsBySymbolDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"assetCountsBySymbol"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paraIds"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"startTime"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Timestamp"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"endTime"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Timestamp"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"assetCountsBySymbol"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"paraIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paraIds"}}},{"kind":"Argument","name":{"kind":"Name","value":"startTime"},"value":{"kind":"Variable","name":{"kind":"Name","value":"startTime"}}},{"kind":"Argument","name":{"kind":"Name","value":"endTime"},"value":{"kind":"Variable","name":{"kind":"Name","value":"endTime"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"paraId"}},{"kind":"Field","name":{"kind":"Name","value":"symbol"}},{"kind":"Field","name":{"kind":"Name","value":"count"}}]}}]}}]} as unknown as DocumentNode<AssetCountsBySymbolQuery, AssetCountsBySymbolQueryVariables>;
export const AccountCountsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"accountCounts"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"threshold"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paraIds"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"startTime"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Timestamp"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"endTime"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Timestamp"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accountCounts"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"threshold"},"value":{"kind":"Variable","name":{"kind":"Name","value":"threshold"}}},{"kind":"Argument","name":{"kind":"Name","value":"paraIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paraIds"}}},{"kind":"Argument","name":{"kind":"Name","value":"startTime"},"value":{"kind":"Variable","name":{"kind":"Name","value":"startTime"}}},{"kind":"Argument","name":{"kind":"Name","value":"endTime"},"value":{"kind":"Variable","name":{"kind":"Name","value":"endTime"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"count"}}]}}]}}]} as unknown as DocumentNode<AccountCountsQuery, AccountCountsQueryVariables>;
export const TotalMessageCountsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"totalMessageCounts"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"startTime"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Timestamp"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"endTime"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Timestamp"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"countBy"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CountOption"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalMessageCounts"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"startTime"},"value":{"kind":"Variable","name":{"kind":"Name","value":"startTime"}}},{"kind":"Argument","name":{"kind":"Name","value":"endTime"},"value":{"kind":"Variable","name":{"kind":"Name","value":"endTime"}}},{"kind":"Argument","name":{"kind":"Name","value":"countBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"countBy"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"paraId"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}}]} as unknown as DocumentNode<TotalMessageCountsQuery, TotalMessageCountsQueryVariables>;