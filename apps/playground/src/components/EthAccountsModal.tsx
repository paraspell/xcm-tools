import { FC } from "react";
import { Modal, Stack, Button } from "@mantine/core";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  accounts: string[];
  onAccountSelect: (account: string) => () => void;
  title?: string;
  onDisconnect?: () => void;
};

const EthAccountsModal: FC<Props> = ({
  isOpen,
  onClose,
  accounts,
  onAccountSelect,
  title = "Select Ethereum account",
  onDisconnect,
}) => (
  <Modal opened={isOpen} onClose={onClose} title={title} centered>
    <Stack gap="xs">
      {accounts.map((account) => (
        <Button
          size="lg"
          variant="subtle"
          key={account}
          onClick={onAccountSelect(account)}
        >
          {`(Metamask) - ${account.replace(/(.{10})..+/, "$1…")}`}
        </Button>
      ))}
      {onDisconnect && (
        <Button size="sm" variant="default" onClick={onDisconnect}>
          Disconnect account
        </Button>
      )}
    </Stack>
  </Modal>
);

export default EthAccountsModal;
