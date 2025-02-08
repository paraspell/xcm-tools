import type { FC, ReactNode } from 'react';
import { Alert } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';

const alertIcon = <IconAlertCircle size={24} />;

type Props = {
  children: ReactNode;
  onAlertCloseClick: () => void;
};

export const ErrorAlert: FC<Props> = ({ children, onAlertCloseClick }) => (
  <Alert
    title="Error"
    icon={alertIcon}
    withCloseButton
    onClose={onAlertCloseClick}
    mt="lg"
    style={{ overflowWrap: 'anywhere' }}
    maw={800}
    w="100%"
    data-testid="error"
  >
    {children}
  </Alert>
);
