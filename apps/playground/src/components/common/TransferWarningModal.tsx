import {
  Button,
  Checkbox,
  Group,
  Modal,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { useDisclosure, useLocalStorage } from '@mantine/hooks';
import { IconAlertTriangle } from '@tabler/icons-react';
import { type FC, useCallback, useRef, useState } from 'react';

import { TRANSFER_WARNING_TEXT } from '../../constants';

const STORAGE_KEY = 'paraspell_transfer_warning_acknowledged';

type Props = {
  opened: boolean;
  onClose: () => void;
  onConfirm: (dontShowAgain: boolean) => void;
};

export const TransferWarningModal: FC<Props> = ({
  opened,
  onClose,
  onConfirm,
}) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      withCloseButton={false}
      centered
      padding="xl"
    >
      <Stack gap="md" align="center">
        <ThemeIcon variant="light" size={64} color="orange" radius="100%">
          <IconAlertTriangle style={{ width: '70%', height: '70%' }} />
        </ThemeIcon>

        <Title order={3}>Proceed with caution</Title>

        <Text ta="center" size="md">
          {TRANSFER_WARNING_TEXT}
        </Text>

        <Checkbox
          label="Do not show again"
          checked={dontShowAgain}
          onChange={(event) => setDontShowAgain(event.currentTarget.checked)}
        />

        <Group mt="sm" w="100%">
          <Button variant="default" onClick={onClose} flex={1}>
            Cancel
          </Button>
          <Button
            color="red"
            onClick={() => onConfirm(dontShowAgain)}
            flex={1.5}
          >
            I understand
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export const useTransferWarning = () => {
  const [opened, { open, close }] = useDisclosure(false);
  const pendingCallbackRef = useRef<(() => void) | null>(null);
  const [acknowledged, setAcknowledged] = useLocalStorage<boolean>({
    key: STORAGE_KEY,
    defaultValue: false,
  });

  const guardTransfer = useCallback(
    (callback: () => void) => {
      if (acknowledged) {
        callback();
      } else {
        pendingCallbackRef.current = callback;
        open();
      }
    },
    [acknowledged, open],
  );

  const onConfirm = useCallback(
    (dontShowAgain: boolean) => {
      if (dontShowAgain) {
        setAcknowledged(true);
      }
      pendingCallbackRef.current?.();
      pendingCallbackRef.current = null;
      close();
    },
    [close, setAcknowledged],
  );

  const onClose = useCallback(() => {
    pendingCallbackRef.current = null;
    close();
  }, [close]);

  return {
    warningOpened: opened,
    warningOnClose: onClose,
    warningOnConfirm: onConfirm,
    guardTransfer,
  };
};
