import { Button, Modal, Stack } from '@mantine/core';
import type { FC } from 'react';

import { getExtensionInfo } from '../../utils/getExtensionInfo';
import { WalletButton } from '../WalletButton/WalletButton';
import classes from './WalletSelectModal.module.css';

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
}) => {
  const onProviderSelectInternal = (provider: string) => () => {
    onProviderSelect(provider);
  };

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title="Connect your wallet"
      centered
      padding="xl"
      classNames={classes}
    >
      <Stack gap="sm">
        {providers.map((provider, index) => {
          const { name, icon } = getExtensionInfo(provider);
          return (
            <WalletButton
              key={index}
              onClick={onProviderSelectInternal(provider)}
              icon={icon}
              label={name}
            >
              {name}
            </WalletButton>
          );
        })}
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
};

export default PolkadotWalletSelectModal;
