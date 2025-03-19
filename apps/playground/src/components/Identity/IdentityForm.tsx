import {
  Button,
  Fieldset,
  Group,
  NumberInput,
  Paper,
  Stack,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import type { TIdentity } from '@paraspell/sdk';
import type { FC } from 'react';

import { useWallet } from '../../hooks/useWallet';
import { XcmApiCheckbox } from '../common/XcmApiCheckbox';
import { ParachainSelect } from '../ParachainSelect/ParachainSelect';

const SUPPORTED_NODES = [
  'AssetHubPolkadot',
  'AssetHubKusama',
  'Polkadot',
  'Kusama',
] as const;

export type FormValues = {
  from: (typeof SUPPORTED_NODES)[number];
  xcmFee?: string;
  regIndex: number;
  maxRegistrarFee: string;
  useApi: boolean;
  identity: TIdentity;
};

type Props = {
  onSubmit: (values: FormValues) => void;
  loading: boolean;
};

const IdentityForm: FC<Props> = ({ onSubmit, loading }) => {
  const form = useForm<FormValues>({
    initialValues: {
      from: 'AssetHubPolkadot',
      xcmFee: '10000000000000000000',
      regIndex: 0,
      maxRegistrarFee: '5000000000',
      identity: {
        display: '',
        legal: '',
        web: '',
        matrix: '',
        email: '',
        image: '',
        twitter: '',
        github: '',
        discord: '',
      },
      useApi: false,
    },

    validate: {},
  });

  const { connectWallet, selectedAccount, isInitialized, isLoadingExtensions } =
    useWallet();

  const onConnectWalletClick = () => void connectWallet();

  return (
    <Paper p="xl" shadow="md">
      <form onSubmit={form.onSubmit(onSubmit)}>
        <Stack>
          <ParachainSelect
            label="Node"
            placeholder="Pick value"
            data={SUPPORTED_NODES}
            data-testid="select-origin"
            {...form.getInputProps('from')}
          />

          <TextInput
            label="XCM fee (optional)"
            placeholder="0"
            data-testid="input-amount"
            {...form.getInputProps('xcmFee')}
          />

          <NumberInput
            label="Registration index"
            placeholder="0"
            required
            withAsterisk={false}
            data-testid="input-reg-index"
            {...form.getInputProps('regIndex')}
          />

          <NumberInput
            label="Max registrar fee"
            placeholder="0"
            required
            withAsterisk={false}
            data-testid="input-max-fee"
            {...form.getInputProps('maxRegistrarFee')}
          />

          <Fieldset>
            <Group>
              <Stack gap="xs" flex={1}>
                <TextInput
                  label="Display name"
                  placeholder='e.g. "Alice"'
                  {...form.getInputProps('identity.display')}
                />
                <TextInput
                  label="Legal name"
                  placeholder='e.g. "Alice Johnson"'
                  {...form.getInputProps('identity.legal')}
                />
                <TextInput
                  label="Web"
                  placeholder='e.g. "https://alice.com"'
                  {...form.getInputProps('identity.web')}
                />
                <TextInput
                  label="Matrix"
                  placeholder='e.g. "@alice:matrix.org"'
                  {...form.getInputProps('identity.matrix')}
                />
                <TextInput
                  label="Email"
                  placeholder="e.g. alice@johnson.org"
                  {...form.getInputProps('identity.email')}
                />
                <TextInput
                  label="Image"
                  placeholder="URL"
                  {...form.getInputProps('identity.image')}
                />
                <TextInput
                  label="Twitter"
                  placeholder='e.g. "@alice"'
                  {...form.getInputProps('identity.twitter')}
                />
                <TextInput
                  label="Github"
                  placeholder='e.g. "alice"'
                  {...form.getInputProps('identity.github')}
                />
                <TextInput
                  label="Discord"
                  placeholder='e.g. "Alice#1234"'
                  {...form.getInputProps('identity.discord')}
                />
              </Stack>
            </Group>
          </Fieldset>

          <XcmApiCheckbox
            {...form.getInputProps('useApi', { type: 'checkbox' })}
          />

          {selectedAccount ? (
            <Button type="submit" loading={loading} data-testid="submit">
              Submit
            </Button>
          ) : (
            <Button
              onClick={onConnectWalletClick}
              data-testid="btn-connect-wallet"
              loading={!isInitialized || isLoadingExtensions}
            >
              Connect wallet
            </Button>
          )}
        </Stack>
      </form>
    </Paper>
  );
};

export default IdentityForm;
