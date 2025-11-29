import {
  Box,
  Button,
  Center,
  Stack,
  Text,
  Title,
  useMantineColorScheme,
} from '@mantine/core';
import { useDisclosure, useScrollIntoView } from '@mantine/hooks';
import type { TChain } from '@paraspell/sdk';
import { EvmBuilder } from '@paraspell/sdk';
import {
  approveToken,
  depositToken,
  EvmBuilder as EvmBuilderPJS,
} from '@paraspell/sdk-pjs';
import type { BrowserProvider } from 'ethers';
import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import type { Address, WalletClient } from 'viem';
import { createWalletClient, custom } from 'viem';
import { darwinia, mainnet, moonbeam, moonriver } from 'viem/chains';
import { Web3 } from 'web3';

import { useWallet } from '../../hooks';
import EvmTrasferStateProvider from '../../providers/EvmTransferState/EvmTransferStateProvider';
import type { EIP6963ProviderDetail, TEvmSubmitType } from '../../types';
import {
  showErrorNotification,
  showLoadingNotification,
  showSuccessNotification,
} from '../../utils/notifications';
import { ErrorAlert } from '../common/ErrorAlert';
import { VersionBadge } from '../common/VersionBadge';
import EthAccountsSelectModal from '../EthAccountsSelectModal';
import EthWalletSelectModal from '../EthWalletSelectModal';
import type { FormValuesTransformed } from './EvmTransferForm';
import EvmTransferForm from './EvmTransferForm';

const VERSION = import.meta.env.VITE_XCM_SDK_VERSION as string;

const EvmTransfer = () => {
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);

  const [alertOpened, { open: openAlert, close: closeAlert }] =
    useDisclosure(false);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);

  const [providers, setProviders] = useState<EIP6963ProviderDetail[]>([]);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accounts, setAccounts] = useState<string[]>([]);
  const [selectedProvider, setSelectedProvider] =
    useState<EIP6963ProviderDetail | null>(null);
  const { apiType } = useWallet();

  const { scrollIntoView, targetRef } = useScrollIntoView<HTMLDivElement>({
    offset: 0,
  });

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      setSelectedAccount(null);
      setAccounts([]);
    } else {
      setAccounts(accounts);
      setIsAccountModalOpen(true);
    }
  };

  useEffect(() => {
    if (selectedProvider && selectedProvider.provider) {
      const provider = selectedProvider.provider;

      provider.on('accountsChanged', handleAccountsChanged);

      return () => {
        provider.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, [selectedProvider]);

  const connectWallet = async () => {
    try {
      const providerMap = await Web3.requestEIP6963Providers();

      if (providerMap.size === 0) {
        showErrorNotification('No compatible Ethereum wallets found.');
        return;
      }

      const providerArray = Array.from(providerMap.values());

      setProviders(providerArray);
      setIsWalletModalOpen(true);
    } catch (_e) {
      showErrorNotification(
        'An error occurred while fetching wallet providers.',
      );
    }
  };

  const onConnectWallet = () => void connectWallet();

  const selectProvider = async (providerInfo: EIP6963ProviderDetail) => {
    try {
      setIsWalletModalOpen(false);
      const provider = providerInfo.provider;

      if (!provider) {
        showErrorNotification('Selected provider is not available.');
        return;
      }

      const tempProvider = new ethers.BrowserProvider(provider);
      setProvider(tempProvider);
      setSelectedProvider(providerInfo);

      const accounts = (await tempProvider.send(
        'eth_requestAccounts',
        [],
      )) as string[];

      if (accounts.length === 0) {
        showErrorNotification('No accounts found in the selected wallet.');
        return;
      }

      setAccounts(accounts);
      setIsAccountModalOpen(true);
    } catch (_error) {
      showErrorNotification(
        'An error occurred while connecting to the wallet.',
      );
    }
  };

  const onProviderSelect = (provider: EIP6963ProviderDetail) => {
    void selectProvider(provider);
  };

  const onAccountSelect = (account: string) => {
    setIsAccountModalOpen(false);
    setSelectedAccount(account);
  };

  useEffect(() => {
    if (error) {
      scrollIntoView();
    }
  }, [error, scrollIntoView]);

  const submitEthTransactionSdk = async ({
    from,
    to,
    amount,
    currency,
    address,
    ahAddress,
    useViem,
  }: FormValuesTransformed) => {
    if (!provider) {
      throw new Error('Provider not initialized');
    }

    const getChain = (chain: TChain) => {
      if (chain === 'Moonbeam') {
        return moonbeam;
      }
      if (chain === 'Moonriver') {
        return moonriver;
      }
      if (chain === 'Darwinia') {
        return darwinia;
      }
      return mainnet;
    };

    const signer = useViem
      ? createWalletClient({
          account: selectedAccount as Address,
          chain: getChain(from),
          transport: custom(window.ethereum!),
        })
      : await provider.getSigner(selectedAccount as Address);

    if (!signer) {
      throw new Error('Signer not initialized');
    }

    const currencyInput = { symbol: currency?.symbol ?? '', amount };

    if (apiType === 'PAPI') {
      if (from === 'Ethereum') {
        throw new Error('Snowbridge does not support PAPI yet');
      }

      if (!useViem) {
        throw new Error(
          'ParaSpell XCM SDK - PAPI version no longer supports ethers.js',
        );
      }

      await EvmBuilder({
        abstractDecimals: true,
      })
        .from(from)
        .to(to)
        .currency(currencyInput)
        .address(address)
        .ahAddress(ahAddress)
        .signer(signer as WalletClient)
        .build();
    } else {
      await EvmBuilderPJS(provider, {
        abstractDecimals: true,
      })
        .from(from)
        .to(to)
        .currency(currencyInput)
        .address(address)
        .ahAddress(ahAddress)
        .signer(signer)
        .build();
    }
  };

  const submitDeposit = async (formValues: FormValuesTransformed) => {
    if (!provider) {
      throw new Error('Provider not initialized');
    }

    const signer = await provider.getSigner();

    if (!signer) {
      throw new Error('Signer not initialized');
    }

    setLoading(true);
    const notifId = showLoadingNotification(
      'Processing',
      'Transaction is being processed',
    );

    const { amount, currency } = formValues;

    if (!currency?.symbol) {
      throw new Error('Currency symbol not found');
    }

    try {
      await depositToken(signer, BigInt(amount), currency?.symbol);
      showSuccessNotification(
        notifId ?? '',
        'Success',
        'Transaction was successful',
      );
    } catch (e) {
      if (e instanceof Error) {
        // eslint-disable-next-line no-console
        console.error(e);
        showErrorNotification(e.message, notifId);
        setError(e);
        openAlert();
      }
    } finally {
      setLoading(false);
    }
  };

  const submitApprove = async (formValues: FormValuesTransformed) => {
    if (!provider) {
      throw new Error('Provider not initialized');
    }

    const signer = await provider.getSigner();

    if (!signer) {
      throw new Error('Signer not initialized');
    }

    setLoading(true);
    const notifId = showLoadingNotification(
      'Processing',
      'Transaction is being processed',
    );

    const { amount, currency } = formValues;

    if (!currency?.symbol) {
      throw new Error('Currency symbol not found');
    }

    try {
      await approveToken(signer, BigInt(amount), currency?.symbol);
      showSuccessNotification(
        notifId ?? '',
        'Success',
        'Transaction was successful',
      );
    } catch (e) {
      if (e instanceof Error) {
        // eslint-disable-next-line no-console
        console.error(e);
        showErrorNotification(e.message, notifId);
        setError(e);
        openAlert();
      }
    } finally {
      setLoading(false);
    }
  };

  const submit = async (
    formValues: FormValuesTransformed,
    submitType: TEvmSubmitType,
  ) => {
    if (!selectedAccount) {
      showErrorNotification('No account selected, connect wallet first');
      throw new Error('No account selected!');
    }

    if (submitType === 'approve') {
      await submitApprove(formValues);
      return;
    }

    if (submitType === 'deposit') {
      await submitDeposit(formValues);
      return;
    }

    setLoading(true);
    const notifId = showLoadingNotification(
      'Processing',
      'Transaction is being processed',
    );

    try {
      await submitEthTransactionSdk(formValues);
      showSuccessNotification(
        notifId ?? '',
        'Success',
        'Transaction was successful',
      );
    } catch (e) {
      if (e instanceof Error) {
        // eslint-disable-next-line no-console
        console.error(e);
        showErrorNotification(e.message, notifId);
        setError(e);
        openAlert();
      }
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (
    formValues: FormValuesTransformed,
    submitType: TEvmSubmitType,
  ) => void submit(formValues, submitType);

  const onAlertCloseClick = () => {
    closeAlert();
  };

  const onWalletDisconnect = () => {
    setSelectedAccount(null);
    setAccounts([]);
    setIsWalletModalOpen(false);
  };

  const theme = useMantineColorScheme();

  return (
    <Stack gap="xl">
      <Stack w="100%" maw={450} mx="auto" gap="lg">
        <Box px="xl" pb="xl">
          <Center mb="sm">
            <Title order={2}>EVM transfer ✨</Title>
          </Center>

          <Center>
            <VersionBadge version={VERSION} />
          </Center>

          <Text
            size="xs"
            c={theme.colorScheme === 'light' ? 'gray.7' : 'dark.1'}
            fw={700}
            ta="center"
          >
            Easily transfer assets from an EVM compatible Parachain.
          </Text>
        </Box>
        <Button
          size="xs"
          variant="light"
          onClick={onConnectWallet}
          data-testid="btn-connect-eth-wallet"
        >
          {selectedAccount
            ? `Connected: ${selectedAccount.substring(0, 6)}...${selectedAccount.substring(selectedAccount.length - 4)}`
            : 'Connect Ethereum Wallet'}
        </Button>
        <EvmTrasferStateProvider>
          <EvmTransferForm
            onSubmit={onSubmit}
            loading={loading}
            provider={provider}
          />
        </EvmTrasferStateProvider>
      </Stack>
      <Center ref={targetRef}>
        {alertOpened && (
          <ErrorAlert onAlertCloseClick={onAlertCloseClick}>
            {error?.message.split('\n\n').map((line, index) => (
              <p key={index}>{line}</p>
            ))}{' '}
          </ErrorAlert>
        )}
      </Center>
      <EthWalletSelectModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        providers={providers}
        onProviderSelect={onProviderSelect}
        onDisconnect={onWalletDisconnect}
      />
      <EthAccountsSelectModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        accounts={accounts}
        onAccountSelect={onAccountSelect}
      />
    </Stack>
  );
};

export default EvmTransfer;
