import {
  Accordion,
  Group,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  TextInput,
} from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';
import { Version } from '@paraspell/sdk';
import { useEffect, useState } from 'react';

import { LOCAL_ACCOUNTS } from '../../constants';
import type { TAdvancedOptions } from '../../types';
import classes from './AdvancedOptions.module.css';
import { ApiOverridesFieldset } from './ApiOverridesFieldset';

const ACCORDION_NAME = 'advanced';

type Props<T extends TAdvancedOptions> = {
  form: UseFormReturnType<T>;
  hideXcmFormatCheck?: boolean;
  hideLocalAccount?: boolean;
  hideVersionAndPallet?: boolean;
};

export const AdvancedOptions = <T extends TAdvancedOptions>({
  form,
  hideXcmFormatCheck = false,
  hideLocalAccount = false,
  hideVersionAndPallet = false,
}: Props<T>) => {
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    const hasError = Object.keys(form.errors).some((key) =>
      key.startsWith('apiOverrides'),
    );

    if (hasError) {
      setOpened(true);
    }
  }, [form.errors]);

  const isOpened = opened ? ACCORDION_NAME : null;

  const onChange = (value: string | null) => {
    setOpened(value === ACCORDION_NAME);
  };

  return (
    <Accordion variant="separated" value={isOpened} onChange={onChange}>
      <Accordion.Item value="advanced">
        <Accordion.Control fz="md" className={classes.control}>
          Advanced options
        </Accordion.Control>
        <Accordion.Panel>
          <Stack gap="lg">
            <SimpleGrid cols={2}>
              <Switch
                label="Development"
                data-testid="switch-development"
                {...form.getInputProps('development', {
                  type: 'checkbox',
                })}
              />

              <Switch
                label="Abstract Decimals"
                data-testid="switch-abstract-decimals"
                {...form.getInputProps('abstractDecimals', {
                  type: 'checkbox',
                })}
              />

              {!hideXcmFormatCheck && (
                <Switch
                  label="XCM Format Check"
                  {...form.getInputProps('xcmFormatCheck', {
                    type: 'checkbox',
                  })}
                />
              )}
            </SimpleGrid>

            {!hideLocalAccount && (
              <Select
                label="Local Account"
                placeholder="Pick value"
                clearable
                searchable
                data={LOCAL_ACCOUNTS}
                data-testid="select-local-account"
                {...form.getInputProps('localAccount')}
              />
            )}

            {!hideVersionAndPallet && (
              <>
                <Select
                  label="XCM Version"
                  placeholder="Pick value"
                  data={Object.values(Version)}
                  data-testid="select-xcm-version"
                  {...form.getInputProps('xcmVersion')}
                />

                <Stack gap="xs">
                  <Group grow>
                    <TextInput
                      label="Pallet"
                      placeholder="Enter pallet name"
                      data-testid="input-pallet"
                      {...form.getInputProps('pallet')}
                    />
                    <TextInput
                      label="Function"
                      placeholder="Enter function name"
                      data-testid="input-method"
                      {...form.getInputProps('method')}
                    />
                  </Group>
                </Stack>
              </>
            )}

            <ApiOverridesFieldset form={form} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  );
};
