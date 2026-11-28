import type { ActionIconProps } from "@mantine/core";
import { ThemeToggle } from "@paraspell/ui";
import type { FC, MouseEvent } from "react";

import { useBurst } from "../Magic/MagicProvider";
import classes from "./MagicThemeToggle.module.css";

type Props = {
  size: ActionIconProps["size"];
  iconSize: number;
};

export const MagicThemeToggle: FC<Props> = ({ size, iconSize }) => {
  const burst = useBurst();

  const onClick = (e: MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    burst(rect.left + rect.width / 2, rect.top + rect.height / 2, 12, 80);
  };

  return (
    <ThemeToggle
      size={size}
      iconSize={iconSize}
      onClick={onClick}
      data-cast
      className={classes.toggle}
    />
  );
};
