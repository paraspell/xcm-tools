import type { FC } from 'react';
import { Alert } from '@mantine/core';
import { IconJson, IconLink } from '@tabler/icons-react';
import { CodeHighlight } from '@mantine/code-highlight';

type Props = {
  onClose: () => void;
  useLinkIcon?: boolean;
  output: string;
};

export const OutputAlert: FC<Props> = ({
  output,
  onClose,
  useLinkIcon = false,
}) => (
  <Alert
    color="green"
    title="Output"
    icon={useLinkIcon ? <IconLink size={24} /> : <IconJson size={24} />}
    withCloseButton
    onClose={onClose}
    mt="lg"
    p="xl"
    style={{ overflowWrap: 'anywhere' }}
    data-testid="output"
  >
    <CodeHighlight
      code={output}
      lang="json"
      style={{
        padding: 0,
        borderRadius: 16,
        marginTop: 20,
        backgroundColor: 'transparent',
        maxWidth: 700,
      }}
    />
  </Alert>
);
