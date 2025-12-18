import {
  ActionIcon,
  Button,
  Fieldset,
  Group,
  Stack,
  TextInput,
} from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';
import { CHAINS, type TChain } from '@paraspell/sdk';
import { IconPlus, IconTrash } from '@tabler/icons-react';

import { ParachainSelect } from '../ParachainSelect/ParachainSelect';
import type {
  AdvancedBaseOptions,
  AdvancedOptions,
} from './AdvancedOptionsAccordion';

type Props<T extends AdvancedOptions | AdvancedBaseOptions> = {
  form: UseFormReturnType<T>;
};

export const CustomEndpointsFieldset = <
  T extends AdvancedOptions | AdvancedBaseOptions,
>({
  form,
}: Props<T>) => {
  const addEndpoint = (chainIndex: number) => {
    const path = `customEndpoints.${chainIndex}.endpoints`;
    (form as unknown as UseFormReturnType<AdvancedBaseOptions>).insertListItem(
      path,
      { value: '' },
    );
  };

  const addChain = () => {
    const path = 'customEndpoints';
    const fromValue = (form.values as { from?: string }).from;
    const defaultChain = fromValue ? (fromValue as TChain) : ('' as TChain);
    (form as unknown as UseFormReturnType<AdvancedBaseOptions>).insertListItem(
      path,
      {
        chain: defaultChain,
        endpoints: [{ value: '' }],
      },
    );
  };
  return (
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
                    flex={1}
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
                        label={endpointIndex === 0 ? 'Endpoints' : undefined}
                        placeholder="Enter endpoint URL"
                        data-testid="input-endpoint"
                        flex={1}
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
                        mt={endpointIndex === 0 ? 'xl' : 'xs'}
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
                    onClick={() => addEndpoint(chainIndex)}
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
          onClick={addChain}
        >
          Add chain
        </Button>
      </Stack>
    </Fieldset>
  );
};
