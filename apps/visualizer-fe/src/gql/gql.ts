/* eslint-disable */
import * as types from './graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
  '\n  query channels($ecosystem: String!) {\n    channels(ecosystem: $ecosystem) {\n      id\n      ecosystem\n      sender\n      recipient\n      transfer_count\n      message_count\n    }\n  }\n': typeof types.ChannelsDocument;
  '\n  query channelsInInterval($ecosystem: String!, $startTime: Timestamp!, $endTime: Timestamp!) {\n    channelsInInterval(ecosystem: $ecosystem, startTime: $startTime, endTime: $endTime) {\n      id\n      ecosystem\n      sender\n      recipient\n      message_count\n    }\n  }\n': typeof types.ChannelsInIntervalDocument;
  '\n  query channel($ecosystem: String!, $sender: Int!, $recipient: Int!) {\n    channel(ecosystem: $ecosystem, sender: $sender, recipient: $recipient) {\n      id\n      ecosystem\n      sender\n      recipient\n      message_count\n      active_at\n    }\n  }\n': typeof types.ChannelDocument;
  '\n  query messageCounts(\n    $ecosystem: String!\n    $paraIds: [Int!]\n    $startTime: Timestamp!\n    $endTime: Timestamp!\n  ) {\n    messageCounts(\n      ecosystem: $ecosystem\n      paraIds: $paraIds\n      startTime: $startTime\n      endTime: $endTime\n    ) {\n      ecosystem\n      paraId\n      success\n      failed\n    }\n  }\n': typeof types.MessageCountsDocument;
  '\n  query messageCountsByDay(\n    $ecosystem: String!\n    $paraIds: [Int!]\n    $startTime: Timestamp!\n    $endTime: Timestamp!\n  ) {\n    messageCountsByDay(\n      ecosystem: $ecosystem\n      paraIds: $paraIds\n      startTime: $startTime\n      endTime: $endTime\n    ) {\n      ecosystem\n      paraId\n      date\n      messageCount\n      messageCountSuccess\n      messageCountFailed\n    }\n  }\n': typeof types.MessageCountsByDayDocument;
  '\n  query assetCountsBySymbol(\n    $ecosystem: String!\n    $paraIds: [Int!]\n    $startTime: Timestamp!\n    $endTime: Timestamp!\n  ) {\n    assetCountsBySymbol(\n      ecosystem: $ecosystem\n      paraIds: $paraIds\n      startTime: $startTime\n      endTime: $endTime\n    ) {\n      ecosystem\n      paraId\n      symbol\n      count\n      amount\n    }\n  }\n': typeof types.AssetCountsBySymbolDocument;
  '\n  query accountCounts(\n    $ecosystem: String!\n    $threshold: Int!\n    $paraIds: [Int!]\n    $startTime: Timestamp!\n    $endTime: Timestamp!\n  ) {\n    accountCounts(\n      ecosystem: $ecosystem\n      threshold: $threshold\n      paraIds: $paraIds\n      startTime: $startTime\n      endTime: $endTime\n    ) {\n      ecosystem\n      id\n      count\n    }\n  }\n': typeof types.AccountCountsDocument;
  '\n  query totalMessageCounts(\n    $ecosystem: String!\n    $startTime: Timestamp!\n    $endTime: Timestamp!\n    $countBy: CountOption!\n  ) {\n    totalMessageCounts(\n      ecosystem: $ecosystem\n      startTime: $startTime\n      endTime: $endTime\n      countBy: $countBy\n    ) {\n      ecosystem\n      paraId\n      totalCount\n    }\n  }\n': typeof types.TotalMessageCountsDocument;
};
const documents: Documents = {
  '\n  query channels($ecosystem: String!) {\n    channels(ecosystem: $ecosystem) {\n      id\n      ecosystem\n      sender\n      recipient\n      transfer_count\n      message_count\n    }\n  }\n':
    types.ChannelsDocument,
  '\n  query channelsInInterval($ecosystem: String!, $startTime: Timestamp!, $endTime: Timestamp!) {\n    channelsInInterval(ecosystem: $ecosystem, startTime: $startTime, endTime: $endTime) {\n      id\n      ecosystem\n      sender\n      recipient\n      message_count\n    }\n  }\n':
    types.ChannelsInIntervalDocument,
  '\n  query channel($ecosystem: String!, $sender: Int!, $recipient: Int!) {\n    channel(ecosystem: $ecosystem, sender: $sender, recipient: $recipient) {\n      id\n      ecosystem\n      sender\n      recipient\n      message_count\n      active_at\n    }\n  }\n':
    types.ChannelDocument,
  '\n  query messageCounts(\n    $ecosystem: String!\n    $paraIds: [Int!]\n    $startTime: Timestamp!\n    $endTime: Timestamp!\n  ) {\n    messageCounts(\n      ecosystem: $ecosystem\n      paraIds: $paraIds\n      startTime: $startTime\n      endTime: $endTime\n    ) {\n      ecosystem\n      paraId\n      success\n      failed\n    }\n  }\n':
    types.MessageCountsDocument,
  '\n  query messageCountsByDay(\n    $ecosystem: String!\n    $paraIds: [Int!]\n    $startTime: Timestamp!\n    $endTime: Timestamp!\n  ) {\n    messageCountsByDay(\n      ecosystem: $ecosystem\n      paraIds: $paraIds\n      startTime: $startTime\n      endTime: $endTime\n    ) {\n      ecosystem\n      paraId\n      date\n      messageCount\n      messageCountSuccess\n      messageCountFailed\n    }\n  }\n':
    types.MessageCountsByDayDocument,
  '\n  query assetCountsBySymbol(\n    $ecosystem: String!\n    $paraIds: [Int!]\n    $startTime: Timestamp!\n    $endTime: Timestamp!\n  ) {\n    assetCountsBySymbol(\n      ecosystem: $ecosystem\n      paraIds: $paraIds\n      startTime: $startTime\n      endTime: $endTime\n    ) {\n      ecosystem\n      paraId\n      symbol\n      count\n      amount\n    }\n  }\n':
    types.AssetCountsBySymbolDocument,
  '\n  query accountCounts(\n    $ecosystem: String!\n    $threshold: Int!\n    $paraIds: [Int!]\n    $startTime: Timestamp!\n    $endTime: Timestamp!\n  ) {\n    accountCounts(\n      ecosystem: $ecosystem\n      threshold: $threshold\n      paraIds: $paraIds\n      startTime: $startTime\n      endTime: $endTime\n    ) {\n      ecosystem\n      id\n      count\n    }\n  }\n':
    types.AccountCountsDocument,
  '\n  query totalMessageCounts(\n    $ecosystem: String!\n    $startTime: Timestamp!\n    $endTime: Timestamp!\n    $countBy: CountOption!\n  ) {\n    totalMessageCounts(\n      ecosystem: $ecosystem\n      startTime: $startTime\n      endTime: $endTime\n      countBy: $countBy\n    ) {\n      ecosystem\n      paraId\n      totalCount\n    }\n  }\n':
    types.TotalMessageCountsDocument
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query channels($ecosystem: String!) {\n    channels(ecosystem: $ecosystem) {\n      id\n      ecosystem\n      sender\n      recipient\n      transfer_count\n      message_count\n    }\n  }\n'
): (typeof documents)['\n  query channels($ecosystem: String!) {\n    channels(ecosystem: $ecosystem) {\n      id\n      ecosystem\n      sender\n      recipient\n      transfer_count\n      message_count\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query channelsInInterval($ecosystem: String!, $startTime: Timestamp!, $endTime: Timestamp!) {\n    channelsInInterval(ecosystem: $ecosystem, startTime: $startTime, endTime: $endTime) {\n      id\n      ecosystem\n      sender\n      recipient\n      message_count\n    }\n  }\n'
): (typeof documents)['\n  query channelsInInterval($ecosystem: String!, $startTime: Timestamp!, $endTime: Timestamp!) {\n    channelsInInterval(ecosystem: $ecosystem, startTime: $startTime, endTime: $endTime) {\n      id\n      ecosystem\n      sender\n      recipient\n      message_count\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query channel($ecosystem: String!, $sender: Int!, $recipient: Int!) {\n    channel(ecosystem: $ecosystem, sender: $sender, recipient: $recipient) {\n      id\n      ecosystem\n      sender\n      recipient\n      message_count\n      active_at\n    }\n  }\n'
): (typeof documents)['\n  query channel($ecosystem: String!, $sender: Int!, $recipient: Int!) {\n    channel(ecosystem: $ecosystem, sender: $sender, recipient: $recipient) {\n      id\n      ecosystem\n      sender\n      recipient\n      message_count\n      active_at\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query messageCounts(\n    $ecosystem: String!\n    $paraIds: [Int!]\n    $startTime: Timestamp!\n    $endTime: Timestamp!\n  ) {\n    messageCounts(\n      ecosystem: $ecosystem\n      paraIds: $paraIds\n      startTime: $startTime\n      endTime: $endTime\n    ) {\n      ecosystem\n      paraId\n      success\n      failed\n    }\n  }\n'
): (typeof documents)['\n  query messageCounts(\n    $ecosystem: String!\n    $paraIds: [Int!]\n    $startTime: Timestamp!\n    $endTime: Timestamp!\n  ) {\n    messageCounts(\n      ecosystem: $ecosystem\n      paraIds: $paraIds\n      startTime: $startTime\n      endTime: $endTime\n    ) {\n      ecosystem\n      paraId\n      success\n      failed\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query messageCountsByDay(\n    $ecosystem: String!\n    $paraIds: [Int!]\n    $startTime: Timestamp!\n    $endTime: Timestamp!\n  ) {\n    messageCountsByDay(\n      ecosystem: $ecosystem\n      paraIds: $paraIds\n      startTime: $startTime\n      endTime: $endTime\n    ) {\n      ecosystem\n      paraId\n      date\n      messageCount\n      messageCountSuccess\n      messageCountFailed\n    }\n  }\n'
): (typeof documents)['\n  query messageCountsByDay(\n    $ecosystem: String!\n    $paraIds: [Int!]\n    $startTime: Timestamp!\n    $endTime: Timestamp!\n  ) {\n    messageCountsByDay(\n      ecosystem: $ecosystem\n      paraIds: $paraIds\n      startTime: $startTime\n      endTime: $endTime\n    ) {\n      ecosystem\n      paraId\n      date\n      messageCount\n      messageCountSuccess\n      messageCountFailed\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query assetCountsBySymbol(\n    $ecosystem: String!\n    $paraIds: [Int!]\n    $startTime: Timestamp!\n    $endTime: Timestamp!\n  ) {\n    assetCountsBySymbol(\n      ecosystem: $ecosystem\n      paraIds: $paraIds\n      startTime: $startTime\n      endTime: $endTime\n    ) {\n      ecosystem\n      paraId\n      symbol\n      count\n      amount\n    }\n  }\n'
): (typeof documents)['\n  query assetCountsBySymbol(\n    $ecosystem: String!\n    $paraIds: [Int!]\n    $startTime: Timestamp!\n    $endTime: Timestamp!\n  ) {\n    assetCountsBySymbol(\n      ecosystem: $ecosystem\n      paraIds: $paraIds\n      startTime: $startTime\n      endTime: $endTime\n    ) {\n      ecosystem\n      paraId\n      symbol\n      count\n      amount\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query accountCounts(\n    $ecosystem: String!\n    $threshold: Int!\n    $paraIds: [Int!]\n    $startTime: Timestamp!\n    $endTime: Timestamp!\n  ) {\n    accountCounts(\n      ecosystem: $ecosystem\n      threshold: $threshold\n      paraIds: $paraIds\n      startTime: $startTime\n      endTime: $endTime\n    ) {\n      ecosystem\n      id\n      count\n    }\n  }\n'
): (typeof documents)['\n  query accountCounts(\n    $ecosystem: String!\n    $threshold: Int!\n    $paraIds: [Int!]\n    $startTime: Timestamp!\n    $endTime: Timestamp!\n  ) {\n    accountCounts(\n      ecosystem: $ecosystem\n      threshold: $threshold\n      paraIds: $paraIds\n      startTime: $startTime\n      endTime: $endTime\n    ) {\n      ecosystem\n      id\n      count\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query totalMessageCounts(\n    $ecosystem: String!\n    $startTime: Timestamp!\n    $endTime: Timestamp!\n    $countBy: CountOption!\n  ) {\n    totalMessageCounts(\n      ecosystem: $ecosystem\n      startTime: $startTime\n      endTime: $endTime\n      countBy: $countBy\n    ) {\n      ecosystem\n      paraId\n      totalCount\n    }\n  }\n'
): (typeof documents)['\n  query totalMessageCounts(\n    $ecosystem: String!\n    $startTime: Timestamp!\n    $endTime: Timestamp!\n    $countBy: CountOption!\n  ) {\n    totalMessageCounts(\n      ecosystem: $ecosystem\n      startTime: $startTime\n      endTime: $endTime\n      countBy: $countBy\n    ) {\n      ecosystem\n      paraId\n      totalCount\n    }\n  }\n'];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> =
  TDocumentNode extends DocumentNode<infer TType, any> ? TType : never;
