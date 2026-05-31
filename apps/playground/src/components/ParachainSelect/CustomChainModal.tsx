import {
  ActionIcon,
  Alert,
  Button,
  Divider,
  Group,
  Modal,
  MultiSelect,
  NumberInput,
  ScrollArea,
  Select,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { isNotEmpty, useForm } from '@mantine/form';
import {
  ASSETS_PALLETS,
  deepEqual,
  RELAYCHAINS,
  Version,
} from '@paraspell/sdk';
import { IconAlertCircle, IconPlus, IconTrash } from '@tabler/icons-react';
import type { FC } from 'react';
import { useState } from 'react';

import type {
  TCustomChainAssetEntry,
  TCustomChainFormValues,
} from '../../types/TCustomChain';
import { validateLocation } from '../../utils/validationUtils';
import { CustomAssetEntry } from '../common/CustomAssetEntry';

const DEFAULT_ASSET: TCustomChainAssetEntry = {
  symbol: '',
  decimals: '',
  assetId: '',
  location: '',
  isNative: false,
};

const DEFAULT_VALUES: TCustomChainFormValues = {
  name: '',
  paraId: '',
  ecosystem: 'Polkadot',
  xcmVersion: Version.V5,
  ss58Prefix: '',
  providers: [{ name: '', endpoint: '' }],
  assets: [],
  pallets: {
    nativeAssets: '',
    otherAssets: [],
  },
};

type Props = {
  opened: boolean;
  onClose: () => void;
  onSubmit?: (values: TCustomChainFormValues) => Promise<void> | void;
};

export const CustomChainModal: FC<Props> = ({ opened, onClose, onSubmit }) => {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<TCustomChainFormValues>({
    initialValues: DEFAULT_VALUES,
    validate: {
      name: isNotEmpty('Name is required'),
      paraId: isNotEmpty('Para ID is required'),
      providers: {
        name: isNotEmpty('Required'),
        endpoint: isNotEmpty('Endpoint is required'),
      },
      assets: {
        symbol: isNotEmpty('Symbol is required'),
        decimals: isNotEmpty('Decimals required'),
        location: (value, values, path) => {
          const err = validateLocation(value);
          if (err) return err;
          const index = Number(path.split('.')[1]);
          const isDuplicate = values.assets.some(
            (asset, i) =>
              i !== index &&
              !validateLocation(asset.location) &&
              deepEqual(JSON.parse(asset.location), JSON.parse(value)),
          );
          return isDuplicate
            ? 'A custom asset with this location already exists on this chain'
            : null;
        },
      },
    },
  });

  const handleClose = () => {
    if (submitting) return;
    form.reset();
    setSubmitError(null);
    onClose();
  };

  const handleSubmit = async (values: TCustomChainFormValues) => {
    setSubmitError(null);
    setSubmitting(true);
    try {
      await onSubmit?.(values);
      form.reset();
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  const addProvider = () => {
    form.insertListItem('providers', { name: '', endpoint: '' });
  };

  const removeProvider = (index: number) => {
    form.removeListItem('providers', index);
  };

  const addAsset = () => {
    form.insertListItem('assets', { ...DEFAULT_ASSET });
  };

  const removeAsset = (index: number) => {
    form.removeListItem('assets', index);
  };

  const handleNativeToggle = (index: number, checked: boolean) => {
    form.getValues().assets.forEach((_, i) => {
      form.setFieldValue(`assets.${i}.isNative`, checked && i === index);
    });
  };

  const values = form.getValues();

  const providerRows = values.providers.map((_, index) => (
    <Group key={index} align="flex-end" wrap="nowrap">
      <TextInput
        label={index === 0 ? 'Provider name' : undefined}
        placeholder="e.g. Parity"
        flex={1}
        key={form.key(`providers.${index}.name`)}
        {...form.getInputProps(`providers.${index}.name`)}
      />
      <TextInput
        label={index === 0 ? 'WS endpoint' : undefined}
        placeholder="wss://..."
        flex={2}
        key={form.key(`providers.${index}.endpoint`)}
        {...form.getInputProps(`providers.${index}.endpoint`)}
      />
      <ActionIcon
        variant="subtle"
        color="red"
        size="lg"
        disabled={values.providers.length <= 1}
        onClick={() => removeProvider(index)}
        aria-label="Remove provider"
      >
        <IconTrash size={16} />
      </ActionIcon>
    </Group>
  ));

  const assetRows = values.assets.map((asset, index) => (
    <CustomAssetEntry
      key={index}
      form={form}
      path={`assets.${index}`}
      isNative={asset.isNative}
      onNativeToggle={(checked) => handleNativeToggle(index, checked)}
      onRemove={() => removeAsset(index)}
    />
  ));

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Add custom chain"
      size="lg"
      centered
      padding="xl"
      scrollAreaComponent={ScrollArea.Autosize}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Register a chain that is not in the built-in list. It will be saved
            locally and available in the chain pickers.
          </Text>

          <Group grow align="flex-start">
            <TextInput
              label="Name"
              placeholder="MyChain"
              required
              key={form.key('name')}
              {...form.getInputProps('name')}
            />
            <NumberInput
              label="Para ID"
              placeholder="2000"
              required
              hideControls
              min={0}
              key={form.key('paraId')}
              {...form.getInputProps('paraId')}
            />
          </Group>

          <Group grow align="flex-start">
            <Select
              label="Ecosystem"
              data={[...RELAYCHAINS]}
              required
              allowDeselect={false}
              key={form.key('ecosystem')}
              {...form.getInputProps('ecosystem')}
            />
            <Select
              label="XCM version"
              data={Object.values(Version)}
              required
              allowDeselect={false}
              key={form.key('xcmVersion')}
              {...form.getInputProps('xcmVersion')}
            />
            <NumberInput
              label="SS58 prefix"
              placeholder="42"
              hideControls
              min={0}
              key={form.key('ss58Prefix')}
              {...form.getInputProps('ss58Prefix')}
            />
          </Group>

          <Divider label="Providers" labelPosition="left" mt="xs" />

          <Stack gap="xs">
            {providerRows}
            <Button
              variant="subtle"
              size="xs"
              leftSection={<IconPlus size={14} />}
              onClick={addProvider}
              style={{ alignSelf: 'flex-start' }}
            >
              Add provider
            </Button>
          </Stack>

          <Divider label="Pallets (optional)" labelPosition="left" mt="xs" />

          <Group grow align="flex-start">
            <Select
              label="Native assets pallet"
              placeholder="e.g. Balances"
              data={[...ASSETS_PALLETS]}
              clearable
              searchable
              key={form.key('pallets.nativeAssets')}
              {...form.getInputProps('pallets.nativeAssets')}
            />
            <MultiSelect
              label="Other assets pallets"
              placeholder="e.g. Assets, Tokens"
              data={[...ASSETS_PALLETS]}
              clearable
              searchable
              key={form.key('pallets.otherAssets')}
              {...form.getInputProps('pallets.otherAssets')}
            />
          </Group>

          <Divider label="Assets" labelPosition="left" mt="xs" />

          <Stack gap="xs">
            {assetRows}
            <Button
              variant="subtle"
              size="xs"
              leftSection={<IconPlus size={14} />}
              onClick={addAsset}
              style={{ alignSelf: 'flex-start' }}
            >
              Add asset
            </Button>
          </Stack>

          {submitError && (
            <Alert
              color="red"
              icon={<IconAlertCircle size={16} />}
              title="Could not register chain"
            >
              {submitError}
            </Alert>
          )}

          <Group justify="flex-end" mt="md">
            <Button
              variant="default"
              onClick={handleClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Save
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};
