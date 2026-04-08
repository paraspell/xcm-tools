import { Alert, Group, Text, Tooltip } from '@mantine/core';
import { IconAlertTriangle, IconInfoCircle } from '@tabler/icons-react';
import { type FC, type ReactNode, useState } from 'react';

import { TRANSFER_WARNING_TEXT } from '../../constants';

const STORAGE_KEY = 'paraspell_submit_warning_dismissed';

const titleNode: ReactNode = (
  <Group gap={4} wrap="nowrap">
    <Text fw={600} size="sm">
      Proceed at your own risk
    </Text>
    <Tooltip label={TRANSFER_WARNING_TEXT} multiline w={250} withArrow>
      <IconInfoCircle size={14} style={{ cursor: 'pointer' }} />
    </Tooltip>
  </Group>
);

export const SubmitWarningAlert: FC = () => {
  const [visible, setVisible] = useState(
    () => localStorage.getItem(STORAGE_KEY) !== 'true',
  );

  if (!visible) return null;

  const onDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setVisible(false);
  };

  return (
    <Alert
      variant="light"
      color="orange"
      icon={<IconAlertTriangle size={16} />}
      title={titleNode}
      py={6}
      px="xs"
      withCloseButton
      onClose={onDismiss}
    />
  );
};
