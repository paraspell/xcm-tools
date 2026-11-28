import type { ActionIconProps, ElementProps } from '@mantine/core';
import { ActionIcon, Box, useMantineColorScheme } from '@mantine/core';
import { IconMoon, IconSun } from '@tabler/icons-react';
import type { FC, MouseEvent } from 'react';

type Props = ActionIconProps &
  ElementProps<'button', 'color'> & {
    iconSize: number;
  };

export const ThemeToggle: FC<Props> = ({ iconSize, onClick, ...props }) => {
  const { toggleColorScheme } = useMantineColorScheme();

  const onToggle = (e: MouseEvent<HTMLButtonElement>) => {
    toggleColorScheme();
    onClick?.(e);
  };

  return (
    <ActionIcon
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
      {...props}
      onClick={onToggle}
    >
      <Box component={IconMoon} size={iconSize} darkHidden />
      <Box component={IconSun} size={iconSize} lightHidden />
    </ActionIcon>
  );
};
