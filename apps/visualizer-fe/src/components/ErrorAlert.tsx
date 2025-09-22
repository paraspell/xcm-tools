import { Alert } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import type { FC, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

const alertIcon = <IconAlertCircle size={24} />;

type Props = {
  children: ReactNode;
  onAlertCloseClick: () => void;
};

const ErrorAlert: FC<Props> = ({ children, onAlertCloseClick }) => {
  const { t } = useTranslation();
  return (
    <Alert
      title={t('status.error')}
      icon={alertIcon}
      withCloseButton
      onClose={onAlertCloseClick}
      mt="lg"
      style={{ overflowWrap: 'anywhere' }}
    >
      {children}
    </Alert>
  );
};

export default ErrorAlert;
