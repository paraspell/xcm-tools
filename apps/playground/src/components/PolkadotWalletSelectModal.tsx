import type { FC } from 'react';
import { Modal, Stack, Button } from '@mantine/core';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  providers: string[];
  onProviderSelect: (provider: string) => void;
  onDisconnect?: () => void;
};

const PolkadotWalletSelectModal: FC<Props> = ({
  isOpen,
  onClose,
  providers,
  onProviderSelect,
  onDisconnect,
}) => (
  <Modal
    opened={isOpen}
    onClose={onClose}
    title="Select Wallet Provider"
    centered
  >
    <Stack gap="sm">
      {providers.map((provider, index) => (
        <Button
          key={index}
          variant="outline"
          onClick={() => onProviderSelect(provider)}
          // leftSection={<Image src={providerInfo.info.icon} h={20} />}
        >
          {provider || `Provider ${index + 1}`}
        </Button>
      ))}
      {onDisconnect && (
        <Button
          size="sm"
          variant="default"
          color="black"
          onClick={onDisconnect}
        >
          Disconnect
        </Button>
      )}
    </Stack>
  </Modal>
);

export default PolkadotWalletSelectModal;
