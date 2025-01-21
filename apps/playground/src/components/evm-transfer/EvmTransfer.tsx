import {
  Stack,
  Box,
  Button,
  useMantineColorScheme,
  Center,
  Title,
  Text,
  Badge,
} from '@mantine/core';
import { useDisclosure, useScrollIntoView } from '@mantine/hooks';
import { useState, useEffect } from 'react';
import type { BrowserProvider, LogDescription } from 'ethers';
import { ethers } from 'ethers';
import ErrorAlert from '../ErrorAlert';
import type { FormValues, FormValuesTransformed } from './EvmTransferForm';
import EvmTransferForm from './EvmTransferForm';
import type { TNode } from '@paraspell/sdk';
import { EvmBuilder as EvmBuilderPJS } from '@paraspell/sdk-pjs';
import { EvmBuilder } from '@paraspell/sdk';
import { fetchFromApi } from '../../utils';
import { IGateway__factory } from '@snowbridge/contract-types';
import type { MultiAddressStruct } from '@snowbridge/contract-types/dist/IGateway';
import { u8aToHex } from '@polkadot/util';
import { decodeAddress } from '@polkadot/keyring';
import { Web3 } from 'web3';
import type { EIP6963ProviderDetail, TEthBridgeApiResponse } from '../../types';
import EthWalletSelectModal from '../EthWalletSelectModal';
import EthAccountsSelectModal from '../EthAccountsSelectModal';
import type { Address } from 'viem';
import { createWalletClient, custom } from 'viem';
import { moonbeam, mainnet, moonriver } from 'viem/chains';
import { useWallet } from '../../hooks/useWallet';
import {
  showErrorNotification,
  showLoadingNotification,
  showSuccessNotification,
} from '../../utils/notifications';

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
    useViem,
  }: FormValuesTransformed) => {
    if (!provider) {
      throw new Error('Provider not initialized');
    }

    const getChain = (node: TNode) => {
      if (node === 'Moonbeam') {
        return moonbeam;
      }
      if (node === 'Moonriver') {
        return moonriver;
      }
      return mainnet;
    };

    const signer = useViem
      ? createWalletClient({
          account: selectedAccount as Address,
          chain: getChain(from),
          transport: custom(window.ethereum!),
        })
      : await provider.getSigner();

    if (!signer) {
      throw new Error('Signer not initialized');
    }

    const currencyInput = { symbol: currency?.symbol ?? '', amount };

    if (apiType === 'PAPI') {
      if (from === 'Ethereum') {
        throw new Error('Snowbridge does not support PAPI yet');
      }

      await EvmBuilder()
        .from(from)
        .to(to)
        .currency(currencyInput)
        .address(address)
        .signer(signer)
        .build();
    } else {
      await EvmBuilderPJS(provider)
        .from(from)
        .to(to)
        .currency(currencyInput)
        .address(address)
        .signer(signer)
        .build();
    }
  };

  const submitEthTransactionApi = async (formValues: FormValuesTransformed) => {
    const { currency } = formValues;
    if (!provider) {
      throw new Error('Provider not initialized');
    }

    const signer = await provider.getSigner();

    if (!signer) {
      throw new Error('Signer not initialized');
    }

    const apiResponse = (await fetchFromApi(
      {
        ...formValues,
        destAddress: formValues.address,
        address: await signer.getAddress(),
        currency: { symbol: currency?.symbol ?? '' },
      },
      '/x-transfer-eth',
      'POST',
      true,
    )) as TEthBridgeApiResponse;

    const GATEWAY_CONTRACT = '0xEDa338E4dC46038493b885327842fD3E301CaB39';

    const contract = IGateway__factory.connect(GATEWAY_CONTRACT, signer);

    const abi = ethers.AbiCoder.defaultAbiCoder();

    const address: MultiAddressStruct = {
      data: abi.encode(
        ['bytes32'],
        [u8aToHex(decodeAddress(formValues.address))],
      ),
      kind: 1,
    };

    const response = await contract.sendToken(
      apiResponse.token,
      apiResponse.destinationParaId,
      address,
      apiResponse.destinationFee,
      apiResponse.amount,
      {
        value: apiResponse.fee,
      },
    );
    const receipt = await response.wait(1);

    if (receipt === null) {
      throw new Error('Error waiting for transaction completion');
    }

    if (receipt?.status !== 1) {
      throw new Error('Transaction failed');
    }

    const events: LogDescription[] = [];
    receipt.logs.forEach((log) => {
      const event = contract.interface.parseLog({
        topics: [...log.topics],
        data: log.data,
      });
      if (event !== null) {
        events.push(event);
      }
    });

    return true;
  };

  const submit = async (formValues: FormValues) => {
    if (!selectedAccount) {
      showErrorNotification('No account selected, connect wallet first');
      throw new Error('No account selected!');
    }

    setLoading(true);
    const notifId = showLoadingNotification(
      'Processing',
      'Transaction is being processed',
    );

    try {
      if (formValues.useApi) {
        await submitEthTransactionApi(formValues);
      } else {
        await submitEthTransactionSdk(formValues);
      }
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

  const onSubmit = (formValues: FormValues) => void submit(formValues);

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
            <Badge
              variant="light"
              radius="xl"
              mb="md"
              style={{ textTransform: 'unset' }}
            >
              v{VERSION}
            </Badge>
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
        <EvmTransferForm onSubmit={onSubmit} loading={loading} />
      </Stack>
      <Box ref={targetRef}>
        {alertOpened && (
          <ErrorAlert onAlertCloseClick={onAlertCloseClick}>
            {error?.message
              .split('\n\n')
              .map((line, index) => <p key={index}>{line}</p>)}{' '}
          </ErrorAlert>
        )}
      </Box>
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
