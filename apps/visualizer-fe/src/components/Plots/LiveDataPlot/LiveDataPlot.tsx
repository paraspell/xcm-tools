import { Anchor, Stack, Table, Text } from '@mantine/core';
import type { FC } from 'react';

import type { LiveXcmMsg } from '../../../types';
import { MessageFlowHeader } from './MessageFlow/MessageFlowHeader';
import { MessageFlowLine } from './MessageFlow/MessageFlowLine';

const explorerLink = (m: LiveXcmMsg) => {
  const e = m.ecosystem.toLowerCase();
  return `https://${e}.subscan.io/xcm_message/${e}-${m.id}`;
};

type Props = {
  data: LiveXcmMsg[];
};

export const LiveDataPlot: FC<Props> = ({ data }) => (
  <Table withTableBorder highlightOnHover striped w="100%" style={{ tableLayout: 'fixed' }}>
    <Table.Tbody>
      {data.map(m => {
        const link = explorerLink(m);
        return (
          <Table.Tr key={m.hash}>
            <Table.Td p={0}>
              <Anchor
                href={link}
                c="body"
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none', cursor: 'pointer' }}
              >
                <Stack p="xs" gap="xs">
                  <MessageFlowHeader message={m} />
                  <MessageFlowLine message={m} />
                  <Text
                    size="xs"
                    mt={-5}
                    c="dimmed"
                    ta="center"
                    title={m.hash}
                    display="block"
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {m.hash}
                  </Text>
                </Stack>
              </Anchor>
            </Table.Td>
          </Table.Tr>
        );
      })}
    </Table.Tbody>
  </Table>
);
