/* eslint-disable */
/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> =
  T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
/** Option to count messages by origin, destination, or both */
export type CountOption = 'BOTH' | 'DESTINATION' | 'ORIGIN';

export type ChannelsQueryVariables = Exact<{
  ecosystem: string;
}>;

export type ChannelsQuery = {
  channels: Array<{
    id: number;
    ecosystem: string;
    sender: number;
    recipient: number;
    transfer_count: number | null;
    message_count: number;
  }>;
};

export type ChannelsInIntervalQueryVariables = Exact<{
  ecosystem: string;
  startTime: unknown;
  endTime: unknown;
}>;

export type ChannelsInIntervalQuery = {
  channelsInInterval: Array<{
    id: number;
    ecosystem: string;
    sender: number;
    recipient: number;
    message_count: number;
  }>;
};

export type ChannelQueryVariables = Exact<{
  ecosystem: string;
  sender: number;
  recipient: number;
}>;

export type ChannelQuery = {
  channel: {
    id: number;
    ecosystem: string;
    sender: number;
    recipient: number;
    message_count: number;
    active_at: number | null;
  };
};

export type MessageCountsQueryVariables = Exact<{
  ecosystem: string;
  parachains: Array<string> | string;
  startTime: unknown;
  endTime: unknown;
}>;

export type MessageCountsQuery = {
  messageCounts: Array<{
    ecosystem: string | null;
    parachain: string | null;
    success: number;
    failed: number;
  }>;
};

export type MessageCountsByDayQueryVariables = Exact<{
  ecosystem: string;
  parachains: Array<string> | string;
  startTime: unknown;
  endTime: unknown;
}>;

export type MessageCountsByDayQuery = {
  messageCountsByDay: Array<{
    ecosystem: string;
    parachain: string | null;
    date: string;
    messageCount: number;
    messageCountSuccess: number;
    messageCountFailed: number;
  }>;
};

export type AssetCountsBySymbolQueryVariables = Exact<{
  ecosystem: string;
  parachains: Array<string> | string;
  startTime: unknown;
  endTime: unknown;
}>;

export type AssetCountsBySymbolQuery = {
  assetCountsBySymbol: Array<{
    ecosystem: string;
    parachain: string | null;
    symbol: string;
    count: number;
    amount: string;
  }>;
};

export type AccountCountsQueryVariables = Exact<{
  ecosystem: string;
  threshold: number;
  paraIds?: Array<number> | number | null | undefined;
  startTime: unknown;
  endTime: unknown;
}>;

export type AccountCountsQuery = {
  accountCounts: Array<{ ecosystem: string; id: string; count: number }>;
};

export type TotalMessageCountsQueryVariables = Exact<{
  ecosystem: string;
  startTime: unknown;
  endTime: unknown;
  countBy: CountOption;
}>;

export type TotalMessageCountsQuery = {
  totalMessageCounts: Array<{ ecosystem: string; paraId: number; totalCount: number }>;
};

export const ChannelsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'channels' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'ecosystem' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } }
          }
        }
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'channels' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'ecosystem' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'ecosystem' } }
              }
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'ecosystem' } },
                { kind: 'Field', name: { kind: 'Name', value: 'sender' } },
                { kind: 'Field', name: { kind: 'Name', value: 'recipient' } },
                { kind: 'Field', name: { kind: 'Name', value: 'transfer_count' } },
                { kind: 'Field', name: { kind: 'Name', value: 'message_count' } }
              ]
            }
          }
        ]
      }
    }
  ]
} as unknown as DocumentNode<ChannelsQuery, ChannelsQueryVariables>;
export const ChannelsInIntervalDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'channelsInInterval' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'ecosystem' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } }
          }
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'startTime' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Timestamp' } }
          }
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'endTime' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Timestamp' } }
          }
        }
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'channelsInInterval' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'ecosystem' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'ecosystem' } }
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'startTime' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'startTime' } }
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'endTime' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'endTime' } }
              }
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'ecosystem' } },
                { kind: 'Field', name: { kind: 'Name', value: 'sender' } },
                { kind: 'Field', name: { kind: 'Name', value: 'recipient' } },
                { kind: 'Field', name: { kind: 'Name', value: 'message_count' } }
              ]
            }
          }
        ]
      }
    }
  ]
} as unknown as DocumentNode<ChannelsInIntervalQuery, ChannelsInIntervalQueryVariables>;
export const ChannelDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'channel' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'ecosystem' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } }
          }
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'sender' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } }
          }
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'recipient' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } }
          }
        }
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'channel' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'ecosystem' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'ecosystem' } }
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'sender' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'sender' } }
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'recipient' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'recipient' } }
              }
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'ecosystem' } },
                { kind: 'Field', name: { kind: 'Name', value: 'sender' } },
                { kind: 'Field', name: { kind: 'Name', value: 'recipient' } },
                { kind: 'Field', name: { kind: 'Name', value: 'message_count' } },
                { kind: 'Field', name: { kind: 'Name', value: 'active_at' } }
              ]
            }
          }
        ]
      }
    }
  ]
} as unknown as DocumentNode<ChannelQuery, ChannelQueryVariables>;
export const MessageCountsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'messageCounts' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'ecosystem' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } }
          }
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'parachains' } },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'ListType',
              type: {
                kind: 'NonNullType',
                type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } }
              }
            }
          }
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'startTime' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Timestamp' } }
          }
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'endTime' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Timestamp' } }
          }
        }
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'messageCounts' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'ecosystem' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'ecosystem' } }
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'parachains' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'parachains' } }
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'startTime' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'startTime' } }
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'endTime' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'endTime' } }
              }
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'ecosystem' } },
                { kind: 'Field', name: { kind: 'Name', value: 'parachain' } },
                { kind: 'Field', name: { kind: 'Name', value: 'success' } },
                { kind: 'Field', name: { kind: 'Name', value: 'failed' } }
              ]
            }
          }
        ]
      }
    }
  ]
} as unknown as DocumentNode<MessageCountsQuery, MessageCountsQueryVariables>;
export const MessageCountsByDayDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'messageCountsByDay' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'ecosystem' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } }
          }
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'parachains' } },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'ListType',
              type: {
                kind: 'NonNullType',
                type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } }
              }
            }
          }
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'startTime' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Timestamp' } }
          }
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'endTime' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Timestamp' } }
          }
        }
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'messageCountsByDay' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'ecosystem' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'ecosystem' } }
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'parachains' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'parachains' } }
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'startTime' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'startTime' } }
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'endTime' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'endTime' } }
              }
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'ecosystem' } },
                { kind: 'Field', name: { kind: 'Name', value: 'parachain' } },
                { kind: 'Field', name: { kind: 'Name', value: 'date' } },
                { kind: 'Field', name: { kind: 'Name', value: 'messageCount' } },
                { kind: 'Field', name: { kind: 'Name', value: 'messageCountSuccess' } },
                { kind: 'Field', name: { kind: 'Name', value: 'messageCountFailed' } }
              ]
            }
          }
        ]
      }
    }
  ]
} as unknown as DocumentNode<MessageCountsByDayQuery, MessageCountsByDayQueryVariables>;
export const AssetCountsBySymbolDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'assetCountsBySymbol' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'ecosystem' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } }
          }
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'parachains' } },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'ListType',
              type: {
                kind: 'NonNullType',
                type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } }
              }
            }
          }
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'startTime' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Timestamp' } }
          }
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'endTime' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Timestamp' } }
          }
        }
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'assetCountsBySymbol' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'ecosystem' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'ecosystem' } }
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'parachains' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'parachains' } }
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'startTime' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'startTime' } }
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'endTime' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'endTime' } }
              }
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'ecosystem' } },
                { kind: 'Field', name: { kind: 'Name', value: 'parachain' } },
                { kind: 'Field', name: { kind: 'Name', value: 'symbol' } },
                { kind: 'Field', name: { kind: 'Name', value: 'count' } },
                { kind: 'Field', name: { kind: 'Name', value: 'amount' } }
              ]
            }
          }
        ]
      }
    }
  ]
} as unknown as DocumentNode<AssetCountsBySymbolQuery, AssetCountsBySymbolQueryVariables>;
export const AccountCountsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'accountCounts' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'ecosystem' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } }
          }
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'threshold' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } }
          }
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'paraIds' } },
          type: {
            kind: 'ListType',
            type: {
              kind: 'NonNullType',
              type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } }
            }
          }
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'startTime' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Timestamp' } }
          }
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'endTime' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Timestamp' } }
          }
        }
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'accountCounts' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'ecosystem' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'ecosystem' } }
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'threshold' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'threshold' } }
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'paraIds' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'paraIds' } }
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'startTime' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'startTime' } }
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'endTime' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'endTime' } }
              }
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'ecosystem' } },
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'count' } }
              ]
            }
          }
        ]
      }
    }
  ]
} as unknown as DocumentNode<AccountCountsQuery, AccountCountsQueryVariables>;
export const TotalMessageCountsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'totalMessageCounts' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'ecosystem' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } }
          }
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'startTime' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Timestamp' } }
          }
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'endTime' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Timestamp' } }
          }
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'countBy' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'CountOption' } }
          }
        }
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'totalMessageCounts' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'ecosystem' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'ecosystem' } }
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'startTime' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'startTime' } }
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'endTime' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'endTime' } }
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'countBy' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'countBy' } }
              }
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'ecosystem' } },
                { kind: 'Field', name: { kind: 'Name', value: 'paraId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'totalCount' } }
              ]
            }
          }
        ]
      }
    }
  ]
} as unknown as DocumentNode<TotalMessageCountsQuery, TotalMessageCountsQueryVariables>;
