import {
  ActionIcon,
  Button,
  Fieldset,
  Group,
  NumberInput,
  Select,
  Stack,
  TextInput,
  useMantineColorScheme,
} from '@mantine/core';
import { createFormActions, type UseFormReturnType } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { TRANSACT_ORIGINS } from '@paraspell/sdk';
import { IconPlus, IconTrash } from '@tabler/icons-react';

import { DEFAULT_TRANSACT_OPTIONS, MAIN_FORM_NAME } from '../../constants';
import type { TTransactFields } from '../../types';

const formActions = createFormActions<TTransactFields>(MAIN_FORM_NAME);

type Props<T extends TTransactFields> = {
  form: UseFormReturnType<T>;
};

export const Transact = <T extends TTransactFields>({ form }: Props<T>) => {
  const { colorScheme } = useMantineColorScheme();

  const [opened, { open, close }] = useDisclosure(
    form.values.transactOptions.call !== '',
  );

  const onRemove = () => {
    formActions.setFieldValue('transactOptions', DEFAULT_TRANSACT_OPTIONS);
    close();
  };

  const ensureMaxWeight = () => {
    if (!form.values.transactOptions.maxWeight) {
      formActions.setFieldValue('transactOptions.maxWeight', {
        refTime: 0,
        proofSize: 0,
      });
    }
  };

  const refTimeProps = form.getInputProps('transactOptions.maxWeight.refTime');
  const proofSizeProps = form.getInputProps(
    'transactOptions.maxWeight.proofSize',
  );

  return (
    <Stack gap="md" py="sm">
      {!opened && (
        <Button
          variant="transparent"
          size="compact-xs"
          leftSection={<IconPlus size={16} />}
          onClick={open}
        >
          Add Transact
        </Button>
      )}
      {opened && (
        <Fieldset legend="Transact" pos="relative">
          <Group>
            <Stack>
              <TextInput
                label="Call"
                description="Hex-encoded call data"
                placeholder="Enter hex"
                data-testid="transact-call-input"
                {...form.getInputProps('transactOptions.call')}
              />
              <Select
                label="Origin Kind"
                data={TRANSACT_ORIGINS}
                data-testid="transact-origin-select"
                {...form.getInputProps('transactOptions.originKind')}
              />
              <Group>
                <NumberInput
                  flex={1}
                  label="Ref Time"
                  placeholder="Enter number"
                  min={0}
                  data-testid="transact-ref-time-input"
                  {...form.getInputProps('transactOptions.maxWeight.refTime')}
                  onFocus={(e) => {
                    ensureMaxWeight();
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                    refTimeProps.onFocus?.(e);
                  }}
                />
                <NumberInput
                  flex={1}
                  label="Proof Size"
                  placeholder="Enter number"
                  min={0}
                  data-testid="transact-proof-size-input"
                  {...form.getInputProps('transactOptions.maxWeight.proofSize')}
                  onFocus={(e) => {
                    ensureMaxWeight();
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                    proofSizeProps.onFocus?.(e);
                  }}
                />
              </Group>
            </Stack>
            <ActionIcon
              color="red"
              variant="subtle"
              bg={colorScheme === 'light' ? 'white' : 'dark.7'}
              pos="absolute"
              right={20}
              top={-25}
              onClick={onRemove}
            >
              <IconTrash size={16} />
            </ActionIcon>
          </Group>
        </Fieldset>
      )}
    </Stack>
  );
};
