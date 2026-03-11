import type { MantineSize } from '@mantine/core';
import {
  Box,
  Burger,
  Button,
  Group,
  Image,
  useComputedColorScheme,
  useMatches,
} from '@mantine/core';
import type { FC } from 'react';

import { NAVIGATION_ITEMS } from '../../../constants';
import { useWallet } from '../../../hooks';
import type { TApiType } from '../../../types';
import { getExtensionInfo } from '../../../utils/getExtensionInfo';
import { ApiTypeSelector } from '../../ApiTypeSelector/ApiTypeSelector';
import { FloatingTabs } from '../../FloatingTabs/FloatingTabs';

type Props = {
  onMenuClick: () => void;
  menuOpened: boolean;
  apiTypeInitialized: boolean;
  isLoadingExtensions: boolean;
  isPinned: boolean;
  onApiTypeChange: (apiType: TApiType) => void;
  onChangeAccountClick: () => void;
  onConnectWalletClick: () => void;
};

export const Header: FC<Props> = ({
  onMenuClick,
  menuOpened,
  apiTypeInitialized,
  isLoadingExtensions,
  isPinned,
  onApiTypeChange,
  onChangeAccountClick,
  onConnectWalletClick,
}) => {
  const { apiType, selectedAccount, isUseXcmApiSelected } = useWallet();

  const { icon } = getExtensionInfo(selectedAccount?.meta.source);

  const isSdkRoute = location.pathname.includes('/xcm-sdk/');

  const colorScheme = useComputedColorScheme();

  const size = useMatches<MantineSize>({
    base: 'xs',
    sm: 'sm',
  });

  const truncateAddress = (
    address: string,
    visibleStart = 6,
    visibleEnd = 4,
  ) =>
    address.length > visibleStart + visibleEnd
      ? `${address.slice(0, visibleStart)}...${address.slice(-visibleEnd)}`
      : address;

  const accountLabel = selectedAccount
    ? (selectedAccount.meta.name ?? truncateAddress(selectedAccount.address))
    : null;

  return (
    <>
      <Box
        w={20}
        h={20}
        pos="absolute"
        left={0}
        bottom={-20}
        bg={colorScheme === 'light' ? 'white' : 'dark.7'}
        visibleFrom="sm"
        style={{
          transition: 'all 150ms',
          opacity: isPinned ? 0 : 1,
          maskImage: 'linear-gradient(135deg, black 30%, transparent 65%)',
        }}
      >
        <Box
          pos="absolute"
          left={0}
          right={0}
          w={20}
          h={20}
          bg={colorScheme === 'light' ? 'gray.0' : 'dark.6'}
          style={{
            borderTopLeftRadius: 16,
            boxShadow:
              'inset 0 0.0625rem 0.1875rem rgba(0, 0, 0, 0.05), inset 0 0.0625rem 0.125rem rgba(0, 0, 0, 0.1)',
            zIndex: 5,
          }}
        />
        <Box
          pos="absolute"
          left={0}
          right={0}
          w={20}
          h={20}
          bg={colorScheme === 'light' ? 'gray.0' : 'dark.6'}
          style={{
            borderTopLeftRadius: 16,
            zIndex: 4,
          }}
        />
      </Box>
      <Group h="100%" justify="flex-end" gap={0}>
        <Burger
          opened={menuOpened}
          onClick={onMenuClick}
          hiddenFrom="xs"
          size="sm"
        />
        <Group gap="lg" flex={1} justify="flex-end">
          {isSdkRoute && <FloatingTabs data={NAVIGATION_ITEMS} />}
          <ApiTypeSelector
            value={apiType}
            onChange={onApiTypeChange}
            apiTypeInitialized={apiTypeInitialized}
            size={size}
            isUseApiSelected={isUseXcmApiSelected}
          />
          {selectedAccount ? (
            <Button
              onClick={onChangeAccountClick}
              variant="outline"
              loading={!apiTypeInitialized}
              size={size}
              rightSection={
                <Image
                  ml={2}
                  src={icon}
                  w={16}
                  radius="sm"
                  alt={selectedAccount.meta.source}
                />
              }
            >
              {accountLabel}
            </Button>
          ) : (
            <Button
              onClick={onConnectWalletClick}
              data-testid="btn-connect-wallet"
              loading={!apiTypeInitialized || isLoadingExtensions}
            >
              Connect wallet
            </Button>
          )}
        </Group>
      </Group>
    </>
  );
};
