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
 */
const documents = {
    "\n  query channels($startTime: Timestamp!, $endTime: Timestamp!) {\n    channels(startTime: $startTime, endTime: $endTime) {\n      id\n      sender\n      recipient\n      message_count\n    }\n  }\n": types.ChannelsDocument,
    "\n  query channel($id: Int!) {\n    channel(id: $id) {\n      id\n      sender\n      recipient\n      message_count\n    }\n  }\n": types.ChannelDocument,
    "\n  query messageCounts($paraIds: [Int!], $startTime: Timestamp!, $endTime: Timestamp!) {\n    messageCounts(paraIds: $paraIds, startTime: $startTime, endTime: $endTime) {\n      paraId\n      success\n      failed\n    }\n  }\n": types.MessageCountsDocument,
    "\n  query messageCountsByDay($paraIds: [Int!], $startTime: Timestamp!, $endTime: Timestamp!) {\n    messageCountsByDay(paraIds: $paraIds, startTime: $startTime, endTime: $endTime) {\n      paraId\n      date\n      messageCount\n      messageCountSuccess\n      messageCountFailed\n    }\n  }\n": types.MessageCountsByDayDocument,
    "\n  query assetCountsBySymbol($paraIds: [Int!], $startTime: Timestamp!, $endTime: Timestamp!) {\n    assetCountsBySymbol(paraIds: $paraIds, startTime: $startTime, endTime: $endTime) {\n      paraId\n      symbol\n      count\n    }\n  }\n": types.AssetCountsBySymbolDocument,
    "\n  query accountCounts(\n    $threshold: Int!\n    $paraIds: [Int!]\n    $startTime: Timestamp!\n    $endTime: Timestamp!\n  ) {\n    accountCounts(\n      threshold: $threshold\n      paraIds: $paraIds\n      startTime: $startTime\n      endTime: $endTime\n    ) {\n      id\n      count\n    }\n  }\n": types.AccountCountsDocument,
    "\n  query totalMessageCounts($startTime: Timestamp!, $endTime: Timestamp!, $countBy: CountOption!) {\n    totalMessageCounts(startTime: $startTime, endTime: $endTime, countBy: $countBy) {\n      paraId\n      totalCount\n    }\n  }\n": types.TotalMessageCountsDocument,
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
export function graphql(source: "\n  query channels($startTime: Timestamp!, $endTime: Timestamp!) {\n    channels(startTime: $startTime, endTime: $endTime) {\n      id\n      sender\n      recipient\n      message_count\n    }\n  }\n"): (typeof documents)["\n  query channels($startTime: Timestamp!, $endTime: Timestamp!) {\n    channels(startTime: $startTime, endTime: $endTime) {\n      id\n      sender\n      recipient\n      message_count\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query channel($id: Int!) {\n    channel(id: $id) {\n      id\n      sender\n      recipient\n      message_count\n    }\n  }\n"): (typeof documents)["\n  query channel($id: Int!) {\n    channel(id: $id) {\n      id\n      sender\n      recipient\n      message_count\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query messageCounts($paraIds: [Int!], $startTime: Timestamp!, $endTime: Timestamp!) {\n    messageCounts(paraIds: $paraIds, startTime: $startTime, endTime: $endTime) {\n      paraId\n      success\n      failed\n    }\n  }\n"): (typeof documents)["\n  query messageCounts($paraIds: [Int!], $startTime: Timestamp!, $endTime: Timestamp!) {\n    messageCounts(paraIds: $paraIds, startTime: $startTime, endTime: $endTime) {\n      paraId\n      success\n      failed\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query messageCountsByDay($paraIds: [Int!], $startTime: Timestamp!, $endTime: Timestamp!) {\n    messageCountsByDay(paraIds: $paraIds, startTime: $startTime, endTime: $endTime) {\n      paraId\n      date\n      messageCount\n      messageCountSuccess\n      messageCountFailed\n    }\n  }\n"): (typeof documents)["\n  query messageCountsByDay($paraIds: [Int!], $startTime: Timestamp!, $endTime: Timestamp!) {\n    messageCountsByDay(paraIds: $paraIds, startTime: $startTime, endTime: $endTime) {\n      paraId\n      date\n      messageCount\n      messageCountSuccess\n      messageCountFailed\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query assetCountsBySymbol($paraIds: [Int!], $startTime: Timestamp!, $endTime: Timestamp!) {\n    assetCountsBySymbol(paraIds: $paraIds, startTime: $startTime, endTime: $endTime) {\n      paraId\n      symbol\n      count\n    }\n  }\n"): (typeof documents)["\n  query assetCountsBySymbol($paraIds: [Int!], $startTime: Timestamp!, $endTime: Timestamp!) {\n    assetCountsBySymbol(paraIds: $paraIds, startTime: $startTime, endTime: $endTime) {\n      paraId\n      symbol\n      count\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query accountCounts(\n    $threshold: Int!\n    $paraIds: [Int!]\n    $startTime: Timestamp!\n    $endTime: Timestamp!\n  ) {\n    accountCounts(\n      threshold: $threshold\n      paraIds: $paraIds\n      startTime: $startTime\n      endTime: $endTime\n    ) {\n      id\n      count\n    }\n  }\n"): (typeof documents)["\n  query accountCounts(\n    $threshold: Int!\n    $paraIds: [Int!]\n    $startTime: Timestamp!\n    $endTime: Timestamp!\n  ) {\n    accountCounts(\n      threshold: $threshold\n      paraIds: $paraIds\n      startTime: $startTime\n      endTime: $endTime\n    ) {\n      id\n      count\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query totalMessageCounts($startTime: Timestamp!, $endTime: Timestamp!, $countBy: CountOption!) {\n    totalMessageCounts(startTime: $startTime, endTime: $endTime, countBy: $countBy) {\n      paraId\n      totalCount\n    }\n  }\n"): (typeof documents)["\n  query totalMessageCounts($startTime: Timestamp!, $endTime: Timestamp!, $countBy: CountOption!) {\n    totalMessageCounts(startTime: $startTime, endTime: $endTime, countBy: $countBy) {\n      paraId\n      totalCount\n    }\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;