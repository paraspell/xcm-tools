import { Alert, Group, Text, Tooltip } from '@mantine/core';
import { useLocalStorage } from '@mantine/hooks';
import { IconAlertTriangle, IconInfoCircle } from '@tabler/icons-react';
import { type FC, type ReactNode } from 'react';

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
  const [dismissed, setDismissed] = useLocalStorage<boolean>({
    key: STORAGE_KEY,
    defaultValue: false,
  });

  if (dismissed) return null;

  const onDismiss = () => {
    setDismissed(true);
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
