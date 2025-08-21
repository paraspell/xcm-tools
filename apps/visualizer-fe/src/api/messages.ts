import { graphql } from '../gql';

export const messageCountsQueryDocument = graphql(`
  query messageCounts($paraIds: [Int!], $startTime: Timestamp!, $endTime: Timestamp!) {
    messageCounts(paraIds: $paraIds, startTime: $startTime, endTime: $endTime) {
      paraId
      success
      failed
    }
  }
`);

export const messageCountsByDayQueryDocument = graphql(`
  query messageCountsByDay($paraIds: [Int!], $startTime: Timestamp!, $endTime: Timestamp!) {
    messageCountsByDay(paraIds: $paraIds, startTime: $startTime, endTime: $endTime) {
      paraId
      date
      messageCount
      messageCountSuccess
      messageCountFailed
    }
  }
`);

export const assetCountsBySymbolQueryDocument = graphql(`
  query assetCountsBySymbol($paraIds: [Int!], $startTime: Timestamp!, $endTime: Timestamp!) {
    assetCountsBySymbol(paraIds: $paraIds, startTime: $startTime, endTime: $endTime) {
      paraId
      symbol
      count
    }
  }
`);

export const accountXcmCountsQueryDocument = graphql(`
  query accountCounts(
    $threshold: Int!
    $paraIds: [Int!]
    $startTime: Timestamp!
    $endTime: Timestamp!
  ) {
    accountCounts(
      threshold: $threshold
      paraIds: $paraIds
      startTime: $startTime
      endTime: $endTime
    ) {
      id
      count
    }
  }
`);

export const totalMessageCountsQueryDocument = graphql(`
  query totalMessageCounts($startTime: Timestamp!, $endTime: Timestamp!, $countBy: CountOption!) {
    totalMessageCounts(startTime: $startTime, endTime: $endTime, countBy: $countBy) {
      paraId
      totalCount
    }
  }
`);
