import { type FC } from 'react';
import { useForm } from '@mantine/form';
import { isValidWalletAddress } from './utils';
import { Button, Select, Stack, TextInput } from '@mantine/core';
import { isRelayChain, NODES_WITH_RELAY_CHAINS, type TNodeWithRelayChains } from '@paraspell/sdk';
import { useTranslation } from 'react-i18next';

export type FormValues = {
  from: TNodeWithRelayChains;
  to: TNodeWithRelayChains;
  currency: string;
  address: string;
  amount: string;
};

type Props = {
  onSubmit: (values: FormValues) => void;
  loading: boolean;
};

const TransferForm: FC<Props> = ({ onSubmit, loading }) => {
  const { t } = useTranslation('translation', { keyPrefix: 'sendXcmForm' });
  const form = useForm<FormValues>({
    initialValues: {
      from: 'Astar',
      to: 'Moonbeam',
      currency: 'GLMR',
      amount: '10000000000000000000',
      address: '5F5586mfsnM6durWRLptYt3jSUs55KEmahdodQ5tQMr9iY96'
    },

    validate: {
      address: value => (isValidWalletAddress(value) ? null : 'Invalid address')
    }
  });

  const isNotParaToPara = isRelayChain(form.values.from) || isRelayChain(form.values.to);

  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Stack>
        <Select
          label={t('senderParachain')}
          placeholder={t('pickValue')}
          data={[...NODES_WITH_RELAY_CHAINS]}
          searchable
          required
          {...form.getInputProps('from')}
        />

        <Select
          label={t('recipientParachain')}
          placeholder={t('pickValue')}
          data={[...NODES_WITH_RELAY_CHAINS]}
          searchable
          required
          {...form.getInputProps('to')}
        />

        {!isNotParaToPara && (
          <TextInput
            label={t('assetSymbol')}
            placeholder="GLMR"
            required
            {...form.getInputProps('currency')}
          />
        )}

        <TextInput
          label={t('recipientAddress')}
          placeholder="0x0000000"
          required
          {...form.getInputProps('address')}
        />

        <TextInput label={t('amount')} placeholder="0" required {...form.getInputProps('amount')} />

        <Button type="submit" loading={loading}>
          {t('submitTransaction')}
        </Button>
      </Stack>
    </form>
  );
};

export default TransferForm;
