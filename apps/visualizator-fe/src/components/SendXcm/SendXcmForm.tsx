import { Button, Select, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import type { TChain, TSubstrateChain } from '@paraspell/sdk';
import { CHAINS, isRelayChain, SUBSTRATE_CHAINS } from '@paraspell/sdk';
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';

export type FormValues = {
  from: TSubstrateChain;
  to: TChain;
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
      address: '5FNDaod3wYTvg48s73H1zSB3gVoKNg2okr6UsbyTuLutTXFz'
    }
  });

  const isNotParaToPara = isRelayChain(form.values.from) || isRelayChain(form.values.to);

  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Stack>
        <Select
          label={t('senderParachain')}
          placeholder={t('pickValue')}
          data={SUBSTRATE_CHAINS}
          searchable
          required
          {...form.getInputProps('from')}
        />

        <Select
          label={t('recipientParachain')}
          placeholder={t('pickValue')}
          data={CHAINS}
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
