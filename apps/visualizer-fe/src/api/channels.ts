import { graphql } from '../gql';

export const allChannelsQueryDocument = graphql(`
  query channels($ecosystem: String!) {
    channels(ecosystem: $ecosystem) {
      id
      ecosystem
      sender
      recipient
      transfer_count
      message_count
    }
  }
`);

export const allChannelsWithinIntervalQueryDocument = graphql(`
  query channelsInInterval($ecosystem: String!, $startTime: Timestamp!, $endTime: Timestamp!) {
    channelsInInterval(ecosystem: $ecosystem, startTime: $startTime, endTime: $endTime) {
      id
      ecosystem
      sender
      recipient
      message_count
    }
  }
`);

export const channelQueryDocument = graphql(`
  query channel($ecosystem: String!, $sender: Int!, $recipient: Int!) {
    channel(ecosystem: $ecosystem, sender: $sender, recipient: $recipient) {
      id
      ecosystem
      sender
      recipient
      message_count
      active_at
    }
  }
`);
