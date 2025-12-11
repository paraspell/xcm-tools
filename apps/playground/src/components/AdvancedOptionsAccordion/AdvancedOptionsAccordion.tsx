import {
  Accordion,
  ActionIcon,
  Button,
  Fieldset,
  Group,
  Select,
  Stack,
  Switch,
  TextInput,
} from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';
import { CHAINS, type TChain, Version } from '@paraspell/sdk';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { z } from 'zod';

import { ParachainSelect } from '../ParachainSelect/ParachainSelect';

export type AdvancedRouterOptions = {
  isDevelopment?: boolean;
  abstractDecimals?: boolean;
  customEndpoints?: TCustomEndpoint[];
};

export type AdvancedOptions = {
  xcmVersion?: Version;
  pallet?: string;
  method?: string;
} & AdvancedRouterOptions;

export type TCustomEndpoint = {
  chain: TChain;
  endpoints: {
    value: string;
  }[];
};

export function validateEndpoint(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'wss:';
  } catch {
    return false;
  }
}

export const TCustomEndpointSchema = z.object({
  chain: z.string(),
  endpoints: z
    .array(
      z.object({
        value: z.string().refine(validateEndpoint),
      }),
    )
    .min(1)
    .default([{ value: '' }]),
});

type Props<T extends AdvancedOptions | AdvancedRouterOptions> = {
  form: UseFormReturnType<T>;
  isRouter?: boolean;
};

export const AdvancedOptionsAccordion = <
  T extends AdvancedOptions | AdvancedRouterOptions,
>({
  form,
  isRouter = false,
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
      style={{
        width: 'calc(100% + 24px)',
        marginLeft: -12,
        marginRight: -12,
      }}
    >
      <Accordion.Item value="advanced" style={{ width: '100%' }}>
        <Accordion.Control>Advanced options</Accordion.Control>
        <Accordion.Panel>
          <Stack gap="lg">
            <Group wrap="wrap">
              <Switch
                label="Development"
                {...form.getInputProps('isDevelopment', {
                  type: 'checkbox',
                })}
                data-testid="switch-development"
                style={{ flex: '1 1 auto' }}
              />

              <Switch
                label="Abstract decimals"
                {...form.getInputProps('abstractDecimals', {
                  type: 'checkbox',
                })}
                data-testid="switch-abstract-decimals"
                style={{ flex: '1 1 auto' }}
              />
            </Group>

            {!isRouter && (
              <>
                <Select
                  label="XCM Version"
                  placeholder="Pick value"
                  data={Object.values(Version)}
                  {...form.getInputProps('xcmVersion')}
                  data-testid="select-xcm-version"
                />

                <Stack gap="xs">
                  <Group grow>
                    <TextInput
                      label="Pallet"
                      placeholder="Enter pallet name"
                      {...form.getInputProps('pallet')}
                      data-testid="input-pallet"
                    />
                    <TextInput
                      label="Function"
                      placeholder="Enter function name"
                      {...form.getInputProps('method')}
                      data-testid="input-method"
                    />
                  </Group>
                </Stack>
              </>
            )}

            <Fieldset legend="Custom endpoints" mt="md">
              <Stack gap="md">
                {(form.values.customEndpoints ?? []).map(
                  (endpointGroup, chainIndex) => (
                    <Fieldset
                      key={chainIndex}
                      legend={`${form.values.customEndpoints?.[chainIndex].chain}`}
                      pos="relative"
                    >
                      <Stack gap="xs">
                        <Group align="flex-end">
                          <ParachainSelect
                            label="Chain"
                            placeholder="Pick value"
                            data={CHAINS}
                            style={{ flex: 1 }}
                            {...form.getInputProps(
                              `customEndpoints.${chainIndex}.chain`,
                            )}
                            data-testid="select-chain"
                          />
                          <ActionIcon
                            color="red"
                            variant="subtle"
                            onClick={() =>
                              form.removeListItem('customEndpoints', chainIndex)
                            }
                            data-testid="button-remove-chain"
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Group>

                        <Stack gap="xs">
                          {endpointGroup.endpoints.map((_, endpointIndex) => (
                            <Group key={endpointIndex} align="flex-start">
                              <TextInput
                                label={
                                  endpointIndex === 0 ? 'Endpoints' : undefined
                                }
                                placeholder="Enter endpoint URL"
                                data-testid="input-endpoint"
                                style={{ flex: 1 }}
                                required
                                {...form.getInputProps(
                                  `customEndpoints.${chainIndex}.endpoints.${endpointIndex}.value`,
                                )}
                              />
                              <ActionIcon
                                color="red"
                                size="md"
                                variant="subtle"
                                disabled={endpointGroup.endpoints.length === 1}
                                onClick={() =>
                                  form.removeListItem(
                                    `customEndpoints.${chainIndex}.endpoints`,
                                    endpointIndex,
                                  )
                                }
                                data-testid="button-remove-endpoint"
                                style={{
                                  marginTop:
                                    endpointIndex === 0 ? '28px' : '5px',
                                }}
                              >
                                <IconTrash size={16} />
                              </ActionIcon>
                            </Group>
                          ))}

                          <Button
                            variant="transparent"
                            size="compact-xs"
                            leftSection={<IconPlus size={16} />}
                            data-testid="button-add-endpoint"
                            onClick={() =>
                              (
                                form.insertListItem as (
                                  path: string,
                                  item: { value: string },
                                ) => void
                              )(`customEndpoints.${chainIndex}.endpoints`, {
                                value: '',
                              })
                            }
                          >
                            Add endpoint
                          </Button>
                        </Stack>
                      </Stack>
                    </Fieldset>
                  ),
                )}

                <Button
                  variant="transparent"
                  size="compact-xs"
                  leftSection={<IconPlus size={16} />}
                  data-testid="button-add-chain"
                  onClick={() =>
                    (
                      form.insertListItem as (
                        path: string,
                        item: TCustomEndpoint,
                      ) => void
                    )('customEndpoints', {
                      chain: 'Astar' as TChain,
                      endpoints: [{ value: '' }],
                    })
                  }
                >
                  Add chain
                </Button>
              </Stack>
            </Fieldset>
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  );
};
