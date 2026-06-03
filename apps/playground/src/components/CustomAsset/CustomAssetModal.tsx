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
import { isNotEmpty, matches, useForm } from '@mantine/form';
import type { TAssetInfo, TCustomAssetInfo, TLocation } from '@paraspell/sdk';
import { deepEqual } from '@paraspell/sdk';
import type { FC } from 'react';
import { useEffect } from 'react';

import type { TCustomAssetFormValues } from '../../types/TCustomAsset';
import { validateLocation } from '../../utils/validationUtils';
import { CustomAssetEntry } from '../common/CustomAssetEntry';

const DEFAULT_VALUES: TCustomAssetFormValues = {
  symbol: '',
  decimals: '',
  assetId: '',
  location: '',
  existentialDeposit: '',
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
  mode?: 'add' | 'edit';
  initialValues?: TCustomAssetFormValues;
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
  mode = 'add',
  initialValues,
  onSubmit,
}) => {
  const isEdit = mode === 'edit';

  const form = useForm<TCustomAssetFormValues>({
    initialValues: DEFAULT_VALUES,
    validate: {
      symbol: isNotEmpty('Symbol is required'),
      decimals: isNotEmpty('Decimals required'),
      existentialDeposit: matches(
        /^(\d+(\.\d+)?)?$/,
        'Existential deposit must be a valid amount',
      ),
      location: (value, values) => {
        const duplicateMsg = 'A custom asset with this location already exists';
        if (values.forceOverride && mode === 'add') {
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

  useEffect(() => {
    if (!opened) return;
    form.setValues(initialValues ?? DEFAULT_VALUES);
    form.resetDirty(initialValues ?? DEFAULT_VALUES);
  }, [opened]);

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
      title={isEdit ? 'Edit custom asset' : 'Add custom asset'}
      size="lg"
      centered
      padding="xl"
      scrollAreaComponent={ScrollArea.Autosize}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            {isEdit
              ? `Update this custom asset. Changes are saved locally and reflected in the currency picker when ${chain} is selected.`
              : `Register a custom asset for the origin chain. It will be saved locally and appear in the currency picker when ${chain} is selected.`}
          </Text>

          <TextInput label="Chain" value={chain} readOnly />

          {!isEdit && (
            <Switch
              label="Force override existing asset"
              description="Override an existing asset's metadata (symbol, decimals, …) keyed by its location."
              checked={forceOverride}
              onChange={(event) =>
                handleForceOverrideToggle(event.currentTarget.checked)
              }
            />
          )}

          {!isEdit && forceOverride && (
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
            hideLocation={!isEdit && forceOverride}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit">{isEdit ? 'Save changes' : 'Save'}</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};
