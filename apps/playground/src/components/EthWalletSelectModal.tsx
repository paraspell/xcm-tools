import { Modal, Stack, Button, Image } from '@mantine/core';
import type { EIP6963ProviderDetail } from '../types';
import type { FC } from 'react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  providers: EIP6963ProviderDetail[];
  onProviderSelect: (providerInfo: EIP6963ProviderDetail) => void;
  onDisconnect?: () => void;
};

const EthWalletSelectModal: FC<Props> = ({
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
      {providers.map((providerInfo, index) => (
        <Button
          key={index}
          variant="outline"
          onClick={() => onProviderSelect(providerInfo)}
          leftSection={<Image src={providerInfo.info.icon} h={20} />}
        >
          {providerInfo.info?.name || `Provider ${index + 1}`}
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

export default EthWalletSelectModal;
