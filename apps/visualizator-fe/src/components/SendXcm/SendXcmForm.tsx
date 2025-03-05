import type { FC } from 'react';
import { useForm } from '@mantine/form';
import { Button, Select, Stack, TextInput } from '@mantine/core';
import type { TNodeDotKsmWithRelayChains, TNodeWithRelayChains } from '@paraspell/sdk';
import { isRelayChain, NODES_WITH_RELAY_CHAINS } from '@paraspell/sdk';
import { useTranslation } from 'react-i18next';

export type FormValues = {
  from: TNodeDotKsmWithRelayChains;
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
      to: 'Acala',
      currency: 'GLMR',
      amount: '10000000000000000000',
      address: '5FA4TfhSWhoDJv39GZPvqjBzwakoX4XTVBNgviqd7sz2YeXC'
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
          placeholder="Enter address"
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
