import { ActionIcon, Fieldset, Group, Stack } from '@mantine/core';
import { createFormActions, type UseFormReturnType } from '@mantine/form';
import { CHAINS } from '@paraspell/sdk';
import { IconTrash } from '@tabler/icons-react';

import { MAIN_FORM_NAME } from '../../constants';
import type { TAdvancedOptions } from '../../types';
import { ParachainSelect } from '../ParachainSelect/ParachainSelect';
import { AddItemButton } from './AddItemButton';
import { EndpointGroup } from './EndpointGroup';

const formActions = createFormActions<TAdvancedOptions>(MAIN_FORM_NAME);

type Props<T extends TAdvancedOptions> = {
  form: UseFormReturnType<T>;
};

export const ApiOverridesFieldset = <T extends TAdvancedOptions>({
  form,
}: Props<T>) => {
  const { insertListItem } = formActions;

  const addEndpoint = (chainIndex: number) => {
    insertListItem(`apiOverrides.${chainIndex}.endpoints`, { url: '' });
  };

  const addChain = () => {
    const fromValue = form.values.from;
    insertListItem('apiOverrides', {
      chain: fromValue ?? CHAINS[0],
      endpoints: [{ url: '' }],
    });
  };
  return (
    <Fieldset legend="API overrides">
      <Stack gap="xl">
        {form.values.apiOverrides.map((group, chainIndex) => {
          const onAddEndpointClick = () => addEndpoint(chainIndex);

          const onChainRemoveClick = () => {
            form.removeListItem('apiOverrides', chainIndex);
          };

          return (
            <Stack key={chainIndex} gap="xs">
              <Group align="center">
                <ParachainSelect
                  data={CHAINS}
                  searchable
                  flex={1}
                  data-testid="select-chain"
                  {...form.getInputProps(`apiOverrides.${chainIndex}.chain`)}
                />
                <ActionIcon
                  color="red"
                  variant="subtle"
                  onClick={onChainRemoveClick}
                  data-testid="button-remove-chain"
                >
                  <IconTrash size={16} />
                </ActionIcon>
              </Group>

              <Stack gap="xs">
                {group.endpoints.map((_, endpointIndex) => (
                  <EndpointGroup
                    key={endpointIndex}
                    form={form}
                    chainIndex={chainIndex}
                    index={endpointIndex}
                  />
                ))}

                <AddItemButton onClick={onAddEndpointClick}>
                  Add endpoint
                </AddItemButton>
              </Stack>
            </Stack>
          );
        })}

        <AddItemButton size="xs" onClick={addChain}>
          Add chain
        </AddItemButton>
      </Stack>
    </Fieldset>
  );
};
