import { graphql } from '../gql';

export const messageCountsQueryDocument = graphql(`
  query messageCounts(
    $ecosystem: String!
    $paraIds: [Int!]
    $startTime: Timestamp!
    $endTime: Timestamp!
  ) {
    messageCounts(
      ecosystem: $ecosystem
      paraIds: $paraIds
      startTime: $startTime
      endTime: $endTime
    ) {
      ecosystem
      paraId
      success
      failed
    }
  }
`);

export const messageCountsByDayQueryDocument = graphql(`
  query messageCountsByDay(
    $ecosystem: String!
    $paraIds: [Int!]
    $startTime: Timestamp!
    $endTime: Timestamp!
  ) {
    messageCountsByDay(
      ecosystem: $ecosystem
      paraIds: $paraIds
      startTime: $startTime
      endTime: $endTime
    ) {
      ecosystem
      paraId
      date
      messageCount
      messageCountSuccess
      messageCountFailed
    }
  }
`);

export const assetCountsBySymbolQueryDocument = graphql(`
  query assetCountsBySymbol(
    $ecosystem: String!
    $paraIds: [Int!]
    $startTime: Timestamp!
    $endTime: Timestamp!
  ) {
    assetCountsBySymbol(
      ecosystem: $ecosystem
      paraIds: $paraIds
      startTime: $startTime
      endTime: $endTime
    ) {
      ecosystem
      paraId
      symbol
      count
      amount
    }
  }
`);

export const accountXcmCountsQueryDocument = graphql(`
  query accountCounts(
    $ecosystem: String!
    $threshold: Int!
    $paraIds: [Int!]
    $startTime: Timestamp!
    $endTime: Timestamp!
  ) {
    accountCounts(
      ecosystem: $ecosystem
      threshold: $threshold
      paraIds: $paraIds
      startTime: $startTime
      endTime: $endTime
    ) {
      ecosystem
      id
      count
    }
  }
`);

export const totalMessageCountsQueryDocument = graphql(`
  query totalMessageCounts(
    $ecosystem: String!
    $startTime: Timestamp!
    $endTime: Timestamp!
    $countBy: CountOption!
  ) {
    totalMessageCounts(
      ecosystem: $ecosystem
      startTime: $startTime
      endTime: $endTime
      countBy: $countBy
    ) {
      ecosystem
      paraId
      totalCount
    }
  }
`);
