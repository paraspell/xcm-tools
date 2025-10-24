import { Center, rem, Text, Tooltip } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';

export const EstimatedAmountInfo = () => (
  <Tooltip
    label="Estimated amount. Final value may vary due to price, fees, and slippage."
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
