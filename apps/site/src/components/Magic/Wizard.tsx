import type { ElementProps } from "@mantine/core";
import { Box } from "@mantine/core";
import { useInterval, useReducedMotion } from "@mantine/hooks";
import type { FC } from "react";
import { useState } from "react";

import classes from "./Magic.module.css";

type Props = ElementProps<"span", "children"> & {
  className: string;
};

export const Wizard: FC<Props> = ({ className, onClick, ...props }) => {
  const reducedMotion = useReducedMotion();
  const [waving, setWaving] = useState(false);

  const wave = () => {
    if (!reducedMotion) setWaving(true);
  };

  useInterval(wave, 5200, { autoInvoke: true });

  return (
    <Box
      component="span"
      className={`${classes.wizard} ${className}`}
      mod={{ waving }}
      onAnimationEnd={() => setWaving(false)}
      onClick={
        onClick &&
        ((e) => {
          wave();
          onClick(e);
        })
      }
      {...props}
    >
      🧙‍♂️
    </Box>
  );
};
