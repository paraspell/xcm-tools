import type { ButtonProps } from '@mantine/core';
import { Button } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import type { FC, ReactNode } from 'react';

type Props = {
  onClick: () => void;
  children: ReactNode;
} & ButtonProps;

export const AddItemButton: FC<Props> = ({ onClick, children, ...props }) => (
  <Button
    variant="transparent"
    size="compact-xs"
    leftSection={<IconPlus size={16} />}
    data-testid="button-add-chain"
    onClick={onClick}
    {...props}
  >
    {children}
  </Button>
);
