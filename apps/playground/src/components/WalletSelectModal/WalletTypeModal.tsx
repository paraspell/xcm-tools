import { Button, Modal, Stack, Text } from '@mantine/core';
import { IconCurrencyEthereum } from '@tabler/icons-react';
import type { FC } from 'react';

import type { TWalletType } from '../../types';
import { PolkadotIcon } from './PolkadotIcon';
import classes from './WalletSelectModal.module.css';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: TWalletType) => void;
};

const ICON_SIZE = 20;

export const WalletTypeModal: FC<Props> = ({ isOpen, onClose, onSelect }) => (
  <Modal
    opened={isOpen}
    onClose={onClose}
    title="Select wallet type"
    centered
    padding="xl"
    classNames={classes}
  >
    <Stack gap="sm">
      <Text size="sm" c="dimmed">
        Pick the type of wallet you want to connect. Only one wallet can be
        active at a time.
      </Text>
      <Button
        variant="outline"
        leftSection={<PolkadotIcon size={ICON_SIZE} />}
        onClick={() => onSelect('substrate')}
        data-testid="btn-wallet-type-substrate"
      >
        Substrate wallet
      </Button>
      <Button
        variant="outline"
        leftSection={<IconCurrencyEthereum size={ICON_SIZE} />}
        onClick={() => onSelect('evm')}
        data-testid="btn-wallet-type-evm"
      >
        Ethereum wallet
      </Button>
    </Stack>
  </Modal>
);
