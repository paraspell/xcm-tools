import type { ComboboxItem } from '@mantine/core';
import {
  Button,
  Group,
  Modal,
  ScrollArea,
  Select,
  Stack,
  Switch,
  Text,
  TextInput,
} from '@mantine/core';
import { isNotEmpty, useForm } from '@mantine/form';
import type { TAssetInfo, TCustomAssetInfo, TLocation } from '@paraspell/sdk';
import { deepEqual } from '@paraspell/sdk';
import type { FC } from 'react';

import type { TCustomAssetFormValues } from '../../types/TCustomAsset';
import { validateLocation } from '../../utils/validationUtils';
import { CustomAssetEntry } from '../common/CustomAssetEntry';

const DEFAULT_VALUES: TCustomAssetFormValues = {
  symbol: '',
  decimals: '',
  assetId: '',
  location: '',
  isNative: false,
  forceOverride: false,
  overrideAssetKey: '',
};

type Props = {
  opened: boolean;
  onClose: () => void;
  chain: string;
  overrideAssetOptions: ComboboxItem[];
  overrideAssetMap: Record<string, TAssetInfo>;
  existingAssets: TCustomAssetInfo[];
  onSubmit?: (values: TCustomAssetFormValues) => void;
};

const isDuplicateLocation = (
  value: string,
  existingAssets: TCustomAssetInfo[],
) => {
  try {
    const parsed = JSON.parse(value) as TLocation;
    return existingAssets.some((a) => deepEqual(a.location, parsed));
  } catch {
    return false;
  }
};

export const CustomAssetModal: FC<Props> = ({
  opened,
  onClose,
  chain,
  overrideAssetOptions,
  overrideAssetMap,
  existingAssets,
  onSubmit,
}) => {
  const form = useForm<TCustomAssetFormValues>({
    initialValues: DEFAULT_VALUES,
    validate: {
      symbol: isNotEmpty('Symbol is required'),
      decimals: isNotEmpty('Decimals required'),
      location: (value, values) => {
        const duplicateMsg = 'A custom asset with this location already exists';
        if (values.forceOverride) {
          return value && isDuplicateLocation(value, existingAssets)
            ? duplicateMsg
            : null;
        }
        const err = validateLocation(value);
        if (err) return err;
        return isDuplicateLocation(value, existingAssets) ? duplicateMsg : null;
      },
      overrideAssetKey: (value, values) =>
        values.forceOverride
          ? isNotEmpty('Pick an asset to override')(value)
          : null,
    },
  });

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const handleSubmit = (values: TCustomAssetFormValues) => {
    onSubmit?.(values);
    handleClose();
  };

  const { forceOverride, isNative, overrideAssetKey } = form.getValues();

  const handleForceOverrideToggle = (checked: boolean) => {
    form.setFieldValue('forceOverride', checked);
    if (!checked) {
      form.setFieldValue('overrideAssetKey', '');
    }
  };

  const handleOverridePick = (key: string | null) => {
    form.setFieldValue('overrideAssetKey', key ?? '');
    if (!key) return;
    const asset = overrideAssetMap[key];
    if (!asset) return;
    form.setValues({
      symbol: asset.symbol,
      decimals: asset.decimals,
      assetId: asset.assetId ?? '',
      isNative: asset.isNative ?? false,
      location: JSON.stringify(asset.location, null, 2),
    });
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Add custom asset"
      size="lg"
      centered
      padding="xl"
      scrollAreaComponent={ScrollArea.Autosize}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Register a custom asset for the origin chain. It will be saved
            locally and appear in the currency picker when {chain} is selected.
          </Text>

          <TextInput label="Chain" value={chain} readOnly />

          <Switch
            label="Force override existing asset"
            description="Override an existing asset's metadata (symbol, decimals, …) keyed by its location."
            checked={forceOverride}
            onChange={(event) =>
              handleForceOverrideToggle(event.currentTarget.checked)
            }
          />

          {forceOverride && (
            <Select
              label="Asset to override"
              placeholder="Pick an asset"
              data={overrideAssetOptions}
              value={overrideAssetKey || null}
              onChange={handleOverridePick}
              error={form.errors.overrideAssetKey}
              searchable
              required
              allowDeselect={false}
            />
          )}

          <CustomAssetEntry
            form={form}
            path=""
            isNative={isNative}
            onNativeToggle={(checked) =>
              form.setFieldValue('isNative', checked)
            }
            hideLocation={forceOverride}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};
