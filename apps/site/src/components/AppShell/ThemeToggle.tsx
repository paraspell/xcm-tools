import type { ActionIconProps } from "@mantine/core";
import { ActionIcon, Box, useMantineColorScheme } from "@mantine/core";
import { IconMoon, IconSun } from "@tabler/icons-react";
import type { FC, MouseEvent } from "react";

import { useBurst } from "../Magic/MagicProvider";
import classes from "./ThemeToggle.module.css";

type Props = {
  size: ActionIconProps["size"];
  iconSize: number;
};

export const ThemeToggle: FC<Props> = ({ size, iconSize }) => {
  const { toggleColorScheme } = useMantineColorScheme();
  const burst = useBurst();

  const onClick = (e: MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    toggleColorScheme();
    burst(rect.left + rect.width / 2, rect.top + rect.height / 2, 12, 80);
  };

  return (
    <ActionIcon
      size={size}
      onClick={onClick}
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
      data-cast
      className={classes.toggle}
    >
      <Box component={IconMoon} size={iconSize} darkHidden />
      <Box component={IconSun} size={iconSize} lightHidden />
    </ActionIcon>
  );
};
