import { Accordion, Group, Stack, Switch } from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';
import { CHAINS, type TChain, type Version } from '@paraspell/sdk';
import { useEffect, useState } from 'react';
import { z } from 'zod';

import { isValidWsEndpoint } from '../../utils/validationUtils';
import { CustomEndpointsFieldset } from './CustomEndpointsFieldset';
import { XcmVersionFields } from './XcmVersionFields';

export type AdvancedBaseOptions = {
  isDevelopment?: boolean;
  abstractDecimals?: boolean;
  customEndpoints?: TCustomEndpoint[];
};

export type AdvancedOptions = {
  xcmVersion?: Version;
  pallet?: string;
  method?: string;
} & AdvancedBaseOptions;

export type TCustomEndpoint = {
  chain: TChain;
  endpoints: {
    value: string;
  }[];
};

export const customEndpointsValidation = {
  endpoints: {
    value: (value: string) => {
      return isValidWsEndpoint(value) ? null : 'Endpoint is not valid';
    },
  },
};

export const TCustomEndpointSchema = z.object({
  chain: z.string().refine((value) => CHAINS.includes(value as TChain), {
    message: 'Invalid chain.',
  }),
  endpoints: z
    .array(
      z.object({
        value: z
          .string()
          .refine(isValidWsEndpoint, { message: 'Invalid endpoint.' }),
      }),
    )
    .min(1)
    .default([{ value: '' }]),
});

type Props<T extends AdvancedOptions | AdvancedBaseOptions> = {
  form: UseFormReturnType<T>;
  hideXcmVersionFields?: boolean;
};

export const AdvancedOptionsAccordion = <
  T extends AdvancedOptions | AdvancedBaseOptions,
>({
  form,
  hideXcmVersionFields = false,
}: Props<T>) => {
  const [opened, setOpened] = useState<string | null>(null);

  useEffect(() => {
    const hasEndpointError = Object.keys(form.errors).some(
      (key) => key.startsWith('customEndpoints') && key.endsWith('.value'),
    );

    if (hasEndpointError) {
      setOpened('advanced');
    }
  }, [form.errors]);

  return (
    <Accordion
      variant="filled"
      value={opened}
      onChange={setOpened}
      ml={-12}
      mr={-12}
      w="calc(100% + 24px)"
    >
      <Accordion.Item value="advanced">
        <Accordion.Control fz="md" c="var(--mantine-color-text)">
          Advanced options
        </Accordion.Control>
        <Accordion.Panel>
          <Stack gap="lg">
            <Group wrap="wrap">
              <Switch
                label="Development"
                {...form.getInputProps('isDevelopment', {
                  type: 'checkbox',
                })}
                data-testid="switch-development"
                flex="1 1 auto"
              />

              <Switch
                label="Abstract decimals"
                {...form.getInputProps('abstractDecimals', {
                  type: 'checkbox',
                })}
                data-testid="switch-abstract-decimals"
                flex="1 1 auto"
              />
            </Group>

            {!hideXcmVersionFields && (
              <XcmVersionFields
                form={form as unknown as UseFormReturnType<AdvancedOptions>}
              />
            )}

            <CustomEndpointsFieldset form={form} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  );
};
