import type { ButtonProps } from "@mantine/core";
import { Button, CopyButton } from "@mantine/core";
import { IconCopy } from "@tabler/icons-react";
import type { FC } from "react";

import classes from "./CopyLabelButton.module.css";

type Props = ButtonProps & {
  value: string;
};

export const CopyLabelButton: FC<Props> = ({ value, ...props }) => (
  <CopyButton value={value} timeout={1600}>
    {({ copied, copy }) => (
      <Button
        leftSection={<IconCopy size={13} />}
        onClick={copy}
        classNames={{ root: classes.root }}
        {...props}
      >
        {copied ? "Copied ✨" : "Copy"}
      </Button>
    )}
  </CopyButton>
);
