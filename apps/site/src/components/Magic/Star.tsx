import type { FC } from "react";

import classes from "./Magic.module.css";

const STAR_PATH =
  "M50 2 C54 34 66 46 98 50 C66 54 54 66 50 98 C46 66 34 54 2 50 C34 46 46 34 50 2Z";

type Props = {
  tone: "gold" | "pink" | "glow";
};

export const Star: FC<Props> = ({ tone }) => (
  <svg viewBox="0 0 100 100" className={classes.star} data-tone={tone}>
    <path d={STAR_PATH} />
  </svg>
);
