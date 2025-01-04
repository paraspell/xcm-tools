import { useState } from 'react';
import { Stack, Title, Box, Group, Button, Modal } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Builder, createApiInstanceForNode } from '@paraspell/sdk-pjs';
import type { ApiPromise } from '@polkadot/api';
import { web3Accounts, web3Enable, web3FromAddress } from '@polkadot/extension-dapp';
import type { Signer } from '@polkadot/api/types';
import { submitTransaction } from './utils';
import type { FormValues } from './SendXcmForm';
import TransferForm from './SendXcmForm';
import ErrorAlert from '../ErrorAlert';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import { useWallet } from '../../hooks/useWallet';
import { useTranslation } from 'react-i18next';
import { NAME } from '../../consts/consts';

const SendXcm = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'sendXcmForm' });
  const { selectedAccount, setSelectedAccount } = useWallet();

  const [accounts, setAccounts] = useState<InjectedAccountWithMeta[]>([]);

  const [alertOpened, { open: openAlert, close: closeAlert }] = useDisclosure(false);

  const [error, setError] = useState<Error>();

  const [loading, setLoading] = useState(false);

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);

  const initAccounts = async () => {
    const allInjected = await web3Enable(NAME);

    if (!allInjected) {
      alert(t('noWalletExtensionFound'));
      throw Error(t('noWalletExtensionFound'));
    }

    const allAccounts = await web3Accounts();
    setAccounts(allAccounts);
  };

  const createTransferTx = (
    { from, to, amount, address, currency }: FormValues,
    api: ApiPromise
  ) => {
    return Builder(api)
      .from(from)
      .to(to)
      .currency({ symbol: currency, amount })
      .address(address)
      .build();
  };

  const submitUsingSdk = async (
    formValues: FormValues,
    injectorAddress: string,
    signer: Signer
  ) => {
    const api = await createApiInstanceForNode(formValues.from);
    const tx = await createTransferTx(formValues, api);
    await submitTransaction(api, tx, signer, injectorAddress);
  };

  const submit = async (formValues: FormValues) => {
    if (!selectedAccount) {
      alert(t('noAccountSelected'));
      throw Error(t('noAccountSelected'));
    }

    setLoading(true);

    const injector = await web3FromAddress(selectedAccount.address);

    try {
      await submitUsingSdk(formValues, selectedAccount.address, injector.signer);
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

  const onAlertCloseClick = () => {
    closeAlert();
  };

  const onAccountSelect = (account: InjectedAccountWithMeta) => () => {
    setSelectedAccount(account);
    closeModal();
  };

  const connectWallet = async () => {
    try {
      await initAccounts();
      openModal();
    } catch (_e) {
      alert('Failed to connect wallet');
    }
  };

  const onConnectWalletClick = () => void connectWallet();

  const changeAccount = async () => {
    try {
      if (!accounts.length) {
        await initAccounts();
      }
      openModal();
    } catch (_e) {
      alert('Failed to change account');
    }
  };

  const onChangeAccountClick = () => void changeAccount();

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
      <Modal opened={modalOpened} onClose={closeModal} title={t('selectAccount')} centered>
        <Stack gap="xs">
          {accounts.map(account => (
            <Button
              size="lg"
              variant="subtle"
              key={account.address}
              onClick={onAccountSelect(account)}
            >
              {`${account.meta.name} (${account.meta.source}) - ${account.address.replace(
                /(.{10})..+/,
                '$1…'
              )}`}
            </Button>
          ))}
        </Stack>
      </Modal>
    </Stack>
  );
};

export default SendXcm;
