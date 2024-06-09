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
  query channel($id: Int!) {
    channel(id: $id) {
      id
      sender
      recipient
      message_count
    }
  }
`);
