import { Center, rem, Text, Tooltip } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import type { FC } from 'react';

type Props = {
  label: string;
};

export const GenericTooltip: FC<Props> = ({ label }) => (
  <Tooltip
    label={label}
    position="top-end"
    withArrow
    transitionProps={{ transition: 'pop-bottom-right' }}
  >
    <Text component="div" style={{ cursor: 'help' }}>
      <Center>
        <IconInfoCircle
          style={{ width: rem(18), height: rem(18) }}
          stroke={1.5}
        />
      </Center>
    </Text>
  </Tooltip>
);

export const AmountTooltip = () => (
  <GenericTooltip label="Decimals auto-handled (e.g. 1 DOT → 10_000_000_000)." />
);

export const AddressTooltip = () => (
  <GenericTooltip label="Enter address or derivation path (e.g. //Alice)." />
);
