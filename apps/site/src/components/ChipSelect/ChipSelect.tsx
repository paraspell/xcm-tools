import { Chip, Group } from "@mantine/core";
import type { FC } from "react";

import classes from "./ChipSelect.module.css";

type Props = {
  data: string[];
  value: string;
  onChange: (value: string) => void;
};

export const ChipSelect: FC<Props> = ({ data, value, onChange }) => (
  <Chip.Group value={value} onChange={onChange}>
    <Group gap="xxs" mt="xs">
      {data.map((item) => (
        <Chip
          key={item}
          value={item}
          icon={null}
          classNames={{ label: classes.label }}
        >
          {item}
        </Chip>
      ))}
    </Group>
  </Chip.Group>
);
