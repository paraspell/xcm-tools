import { Box, Button, Group, Stack, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Builder, createApiInstanceForNode } from '@paraspell/sdk';
import type { PolkadotClient } from 'polkadot-api';
import type { InjectedExtension, PolkadotSigner } from 'polkadot-api/pjs-signer';
import { connectInjectedExtension, getInjectedExtensions } from 'polkadot-api/pjs-signer';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useWallet } from '../../hooks/useWallet';
import type { TWalletAccount } from '../../types';
import AccountSelectModal from '../AccountSelectModal/AccountSelectModal';
import ErrorAlert from '../ErrorAlert';
import WalletSelectModal from '../WalletSelectModal/WalletSelectModal';
import type { FormValues } from './SendXcmForm';
import TransferForm from './SendXcmForm';
import { submitTransaction } from './utils';

const SendXcm = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'sendXcmForm' });
  const { selectedAccount, setSelectedAccount } = useWallet();

  const [extensions, setExtensions] = useState<string[]>([]);

  const [injectedExtension, setInjectedExtension] = useState<InjectedExtension>();

  const [accounts, setAccounts] = useState<TWalletAccount[]>([]);

  const [alertOpened, { open: openAlert, close: closeAlert }] = useDisclosure(false);

  const [error, setError] = useState<Error>();

  const [loading, setLoading] = useState(false);

  const [accountsModalOpened, { open: openAccountsModal, close: closeAccountsModal }] =
    useDisclosure(false);

  const [walletSelectModalOpened, { open: openWalletSelectModal, close: closeWalletSelectModal }] =
    useDisclosure(false);

  const initExtensions = () => {
    const extensions = getInjectedExtensions();

    if (!extensions) {
      alert(t('noWalletExtensionFound'));
      throw Error(t('noWalletExtensionFound'));
    }

    setExtensions(extensions);
  };

  const createTransferTx = (
    { from, to, amount, address, currency }: FormValues,
    api: PolkadotClient
  ) => {
    return Builder(api)
      .from(from)
      .to(to)
      .currency({ symbol: currency, amount })
      .address(address)
      .build();
  };

  const submitUsingSdk = async (formValues: FormValues, signer: PolkadotSigner) => {
    const api = await createApiInstanceForNode(formValues.from);
    const tx = await createTransferTx(formValues, api);
    await submitTransaction(tx, signer);
  };

  const submit = async (formValues: FormValues) => {
    if (!selectedAccount) {
      alert(t('noAccountSelected'));
      throw Error(t('noAccountSelected'));
    }

    setLoading(true);

    const signer = await getSigner();

    try {
      await submitUsingSdk(formValues, signer);
      alert(t('transactionSuccess'));
    } catch (e) {
      if (e instanceof Error) {
        // eslint-disable-next-line no-console
        console.error(e);
        setError(e);
        openAlert();
      }
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (formValues: FormValues) => void submit(formValues);

  const getSigner = async () => {
    if (!selectedAccount) {
      throw new Error('No selected account');
    }

    if (!injectedExtension && !selectedAccount.meta.source) {
      throw new Error('No selected extension');
    }

    const extension =
      !injectedExtension && selectedAccount.meta.source
        ? await connectInjectedExtension(selectedAccount.meta.source)
        : injectedExtension;

    const account = extension
      ?.getAccounts()
      .find(account => account.address === selectedAccount.address);
    if (!account) {
      throw new Error('No selected account');
    }
    return account.polkadotSigner;
  };

  const onAlertCloseClick = () => {
    closeAlert();
  };

  const onAccountSelect = (account: TWalletAccount) => {
    setSelectedAccount(account);
    closeAccountsModal();
  };

  const onConnectWalletClick = () => {
    try {
      initExtensions();
      openWalletSelectModal();
    } catch (_e) {
      alert('Failed to connect wallet');
    }
  };

  const onExtensionSelect = (extension: string) => void selectExtension(extension);

  const selectExtension = async (walletName: string) => {
    try {
      const selectedExtension = await connectInjectedExtension(walletName);
      setInjectedExtension(selectedExtension);
      const accounts = selectedExtension.getAccounts();

      if (!accounts.length) {
        alert('No accounts found in the selected wallet');
        throw Error('No accounts found in the selected wallet');
      }

      setAccounts(
        accounts.map(account => ({
          address: account.address,
          meta: {
            name: account.name,
            source: selectedExtension.name
          }
        }))
      );
      closeWalletSelectModal();
      openAccountsModal();
    } catch (_e) {
      alert('Failed to connect to wallet');
      closeWalletSelectModal();
    }
  };

  const onChangeAccountClick = () => {
    try {
      if (!accounts.length) {
        initExtensions();
      }
      openWalletSelectModal();
    } catch (_e) {
      alert('Failed to change account');
    }
  };

  const onDisconnect = () => {
    setSelectedAccount(undefined);
    closeAccountsModal();
  };

  return (
    <Stack gap="xl">
      <Stack w="100%" maw={400} mx="auto" gap="lg">
        <Group justify="space-between">
          <Title order={3}>{t('title')}</Title>
          {selectedAccount ? (
            <Button
              onClick={onChangeAccountClick}
              variant="outline"
            >{`${selectedAccount.meta.name} (${selectedAccount.meta.source})`}</Button>
          ) : (
            <Button onClick={onConnectWalletClick}>{t('connectWallet')}</Button>
          )}
        </Group>
        <TransferForm onSubmit={onSubmit} loading={loading} />
      </Stack>
      <Box>
        {alertOpened && (
          <ErrorAlert onAlertCloseClick={onAlertCloseClick}>{error?.message}</ErrorAlert>
        )}
      </Box>
      <AccountSelectModal
        isOpen={accountsModalOpened}
        onClose={closeAccountsModal}
        accounts={accounts}
        onAccountSelect={onAccountSelect}
        onDisconnect={selectedAccount ? onDisconnect : undefined}
      />
      <WalletSelectModal
        isOpen={walletSelectModalOpened}
        onClose={closeWalletSelectModal}
        providers={extensions}
        onProviderSelect={onExtensionSelect}
      />
    </Stack>
  );
};

export default SendXcm;
