import { Button, Group, Modal, Radio, Stack, Text } from '@mantine/core';
import type { BatchMode } from '@paraspell/sdk';
import { type FC, useState } from 'react';

import classes from './AccountSelectModal.module.css';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onBatchTypeSelect: (account: `${BatchMode}`) => void;
};

export const BatchTypeSelectModal: FC<Props> = ({
  isOpen,
  onClose,
  onBatchTypeSelect,
}) => {
  const [value, setValue] = useState('BATCH');

  const cards = [
    {
      label: 'Batch',
      description: 'Send a batch of dispatch calls',
      value: 'BATCH',
    },
    {
      label: 'Batch All',
      description:
        'Send a batch of dispatch calls and atomically execute them. The whole transaction will rollback and fail if any of the calls failed.',
      value: 'BATCH_ALL',
    },
  ].map(({ label, description, value }) => (
    <Radio.Card key={value} value={value} className={classes.root}>
      <Group wrap="nowrap" align="flex-start">
        <Radio.Indicator />
        <div>
          <Text className={classes.label}>{label}</Text>
          <Text className={classes.description}>{description}</Text>
        </div>
      </Group>
    </Radio.Card>
  ));

  const onSubmitClick = () => {
    onBatchTypeSelect(value as `${BatchMode}`);
  };

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title="Select batch mode"
      centered
      padding="xl"
      classNames={classes}
    >
      <Stack gap="xs">
        <Radio.Group value={value} onChange={setValue}>
          <Stack gap="xs">{cards}</Stack>
        </Radio.Group>
        <Button mt="sm" onClick={onSubmitClick}>
          Confirm
        </Button>
      </Stack>
    </Modal>
  );
};

export default BatchTypeSelectModal;
