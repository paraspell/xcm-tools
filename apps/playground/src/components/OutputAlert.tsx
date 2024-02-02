import { Text, Alert } from '@mantine/core';
import { IconJson } from '@tabler/icons-react';
import { FC, ReactNode } from 'react';

const jsonIcon = <IconJson size={24} />;

type Props = {
  children: ReactNode;
  onClose: () => void;
};

const OutputAlert: FC<Props> = ({ children, onClose }) => (
  <Alert
    color="green"
    title="Output"
    icon={jsonIcon}
    withCloseButton
    onClose={onClose}
    mt="lg"
    style={{ overflowWrap: 'anywhere' }}
  >
    <Text component="pre" size="sm">
      {children}
    </Text>
  </Alert>
);

export default OutputAlert;
