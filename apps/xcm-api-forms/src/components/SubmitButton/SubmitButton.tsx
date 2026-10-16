import { Button, Loader, Text } from '@mantine/core';
import type { FC, ReactNode } from 'react';

import { RecaptchaNotice } from '../RecaptchaNotice/RecaptchaNotice';

type Props = {
  icon: ReactNode;
  label: string;
  loadingLabel: string;
  loading: boolean;
  error?: string;
  onClick?: () => void;
};

export const SubmitButton: FC<Props> = ({
  icon,
  label,
  loadingLabel,
  loading,
  error,
  onClick,
}) => (
  <>
    <Button
      type="submit"
      fullWidth
      size="lg"
      fz="md"
      fw={700}
      mt={24}
      onClick={onClick}
      leftSection={loading ? <Loader size={18} color="white" /> : icon}
    >
      {loading ? loadingLabel : label}
    </Button>
    {error && (
      <Text variant="error" role="alert">
        {error}
      </Text>
    )}
    <RecaptchaNotice />
  </>
);
