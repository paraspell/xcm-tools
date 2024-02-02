import { Stack, Text } from '@mantine/core';

const TransferTypesInfo = () => (
  <Stack gap="lg" p="sm">
    <Text fw="bold">Available test transaction types:</Text>
    <Text>
      <Text component="b" fw="bold">
        FULL_TRANSFER
      </Text>
      (Transfer to exchange chain, exchange currency and transfer to destination chain)
    </Text>
    <Text>
      <Text component="b" fw="bold">
        FROM_EXCHANGE
      </Text>
      (Only perform transfer from selected exchange chain to selected destination chain)
    </Text>
    <Text>
      <Text component="b" fw="bold">
        TO_EXCHANGE
      </Text>
      (Only perform transfer from selected origin chain to selected exchange chain)
    </Text>
    <Text>
      <Text component="b" fw="bold">
        SWAP
      </Text>
      (Perform currency swap operation on selected exchange chain with given currencies)
    </Text>
  </Stack>
);

export default TransferTypesInfo;
