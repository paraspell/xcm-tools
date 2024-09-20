import { Text, Alert } from "@mantine/core";
import { IconJson, IconLink } from "@tabler/icons-react";
import { FC, ReactNode } from "react";

const jsonIcon = <IconJson size={24} />;
const linkIcon = <IconLink size={24} />;

type Props = {
  children: ReactNode;
  onClose: () => void;
  useLinkIcon?: boolean;
};

const OutputAlert: FC<Props> = ({ children, onClose, useLinkIcon }) => (
  <Alert
    color="green"
    title="Output"
    icon={useLinkIcon ? linkIcon : jsonIcon}
    withCloseButton
    onClose={onClose}
    mt="lg"
    style={{ overflowWrap: "anywhere" }}
    data-testid="output"
  >
    <Text component="pre" size="sm">
      {children}
    </Text>
  </Alert>
);

export default OutputAlert;
