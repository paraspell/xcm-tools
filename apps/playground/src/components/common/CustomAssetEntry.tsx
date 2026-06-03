import {
  ActionIcon,
  Checkbox,
  Grid,
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
        <Grid gap="xs" align="flex-end">
          <Grid.Col span={6}>
            <TextInput
              label="Symbol"
              placeholder="DOT"
              key={form.key(`${prefix}symbol`)}
              {...form.getInputProps(`${prefix}symbol`)}
            />
          </Grid.Col>
          <Grid.Col span={3}>
            <NumberInput
              label="Decimals"
              placeholder="10"
              hideControls
              min={0}
              max={36}
              key={form.key(`${prefix}decimals`)}
              {...form.getInputProps(`${prefix}decimals`)}
            />
          </Grid.Col>
          <Grid.Col span={3}>
            <Group
              justify="space-between"
              wrap="nowrap"
              align="center"
              h="var(--input-height-sm)"
              mb={2}
            >
              <Checkbox
                label="Native"
                checked={isNative}
                onChange={(event) =>
                  onNativeToggle(event.currentTarget.checked)
                }
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
          </Grid.Col>
          <Grid.Col span={6}>
            <TextInput
              label="Asset ID (optional)"
              placeholder="—"
              key={form.key(`${prefix}assetId`)}
              {...form.getInputProps(`${prefix}assetId`)}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <TextInput
              label="Existential deposit (optional)"
              placeholder="0.01"
              key={form.key(`${prefix}existentialDeposit`)}
              {...form.getInputProps(`${prefix}existentialDeposit`)}
            />
          </Grid.Col>
        </Grid>
        {!hideLocation && (
          <JsonInput
            label="Location"
            placeholder='{ "parents": 1, "interior": "Here" }'
            validationError="Location must be valid JSON"
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
