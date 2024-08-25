import { graphql } from '../gql';

export const allChannelsQueryDocument = graphql(`
  query channels($startTime: Timestamp!, $endTime: Timestamp!) {
    channels(startTime: $startTime, endTime: $endTime) {
      id
      sender
      recipient
      message_count
    }
  }
`);

export const channelQueryDocument = graphql(`
  query channel($sender: Int!, $recipient: Int!) {
    channel(sender: $sender, recipient: $recipient) {
      id
      sender
      recipient
      message_count
      active_at
    }
  }
`);
