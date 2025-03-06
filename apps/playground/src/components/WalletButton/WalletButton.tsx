import type { ButtonProps } from '@mantine/core';
import {
  Button,
  Image,
  useComputedColorScheme,
  useMantineTheme,
} from '@mantine/core';
import { IconArrowRight } from '@tabler/icons-react';
import type { FC } from 'react';

import classes from './WalletButton.module.css';

type Props = ButtonProps & {
  icon: string;
  label: string;
  onClick?: () => void;
};

export const WalletButton: FC<Props> = ({ icon, label, onClick }) => {
  const theme = useMantineTheme();
  const colorScheme = useComputedColorScheme();
  return (
    <Button
      variant="outline"
      size="md"
      h={64}
      color={colorScheme === 'light' ? 'gray.4' : 'dark.4'}
      c={colorScheme === 'light' ? 'gray.7' : 'dark.0'}
      justify="start"
      px="xl"
      leftSection={<Image mr="md" w={24} src={icon} alt={label} />}
      rightSection={
        <IconArrowRight
          stroke={1.5}
          color={
            colorScheme === 'light'
              ? theme.colors.gray[7]
              : theme.colors.dark[0]
          }
          size={24}
        />
      }
      classNames={classes}
      onClick={onClick}
    >
      {label}
    </Button>
  );
};
