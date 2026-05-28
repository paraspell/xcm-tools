import {
  ActionIcon,
  Checkbox,
  Group,
  JsonInput,
  NumberInput,
  Paper,
  Stack,
  TextInput,
} from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';
import { IconTrash } from '@tabler/icons-react';

type Props<T> = {
  form: UseFormReturnType<T>;
  path: string;
  isNative: boolean;
  onNativeToggle: (checked: boolean) => void;
  onRemove?: () => void;
  hideLocation?: boolean;
};

export const CustomAssetEntry = <T,>({
  form,
  path,
  isNative,
  onNativeToggle,
  onRemove,
  hideLocation,
}: Props<T>) => {
  const prefix = path ? `${path}.` : '';
  return (
    <Paper withBorder p="sm">
      <Stack gap="xs">
        <Group align="flex-end" wrap="nowrap">
          <TextInput
            label="Symbol"
            placeholder="DOT"
            flex={1}
            key={form.key(`${prefix}symbol`)}
            {...form.getInputProps(`${prefix}symbol`)}
          />
          <NumberInput
            label="Decimals"
            placeholder="10"
            hideControls
            min={0}
            max={36}
            w={90}
            key={form.key(`${prefix}decimals`)}
            {...form.getInputProps(`${prefix}decimals`)}
          />
          <TextInput
            label="Asset ID (optional)"
            placeholder="—"
            flex={1}
            key={form.key(`${prefix}assetId`)}
            {...form.getInputProps(`${prefix}assetId`)}
          />
          <Checkbox
            label="Native"
            checked={isNative}
            onChange={(event) => onNativeToggle(event.currentTarget.checked)}
            styles={{ root: { paddingBottom: 8 } }}
          />
          {onRemove && (
            <ActionIcon
              variant="subtle"
              color="red"
              size="lg"
              onClick={onRemove}
              aria-label="Remove asset"
            >
              <IconTrash size={16} />
            </ActionIcon>
          )}
        </Group>
        {!hideLocation && (
          <JsonInput
            label="Location"
            placeholder='{ "parents": 1, "interior": "Here" }'
            formatOnBlur
            autosize
            minRows={3}
            key={form.key(`${prefix}location`)}
            {...form.getInputProps(`${prefix}location`)}
          />
        )}
      </Stack>
    </Paper>
  );
};
