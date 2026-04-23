import { Button, Image, Modal, Stack } from '@mantine/core';
import type { EIP6963ProviderDetail } from 'mipd';
import type { FC } from 'react';

import classes from './WalletSelectModal/WalletSelectModal.module.css';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  providers: readonly EIP6963ProviderDetail[];
  onProviderSelect: (providerInfo: EIP6963ProviderDetail) => void;
  onDisconnect?: () => void;
};

export const EthWalletSelectModal: FC<Props> = ({
  isOpen,
  onClose,
  providers,
  onProviderSelect,
  onDisconnect,
}) => (
  <Modal
    opened={isOpen}
    onClose={onClose}
    title="Connect your wallet"
    centered
    padding="xl"
    classNames={classes}
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
