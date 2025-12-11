import { ActionIcon, Group, TextInput } from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';
import { IconTrash } from '@tabler/icons-react';

import type { TAdvancedOptions } from '../../types';

type Props<T extends TAdvancedOptions> = {
  form: UseFormReturnType<T>;
  chainIndex: number;
  index: number;
};

export const EndpointGroup = <T extends TAdvancedOptions>({
  form,
  chainIndex,
  index,
}: Props<T>) => {
  const onRemoveClick = () => {
    form.removeListItem(`apiOverrides.${chainIndex}.endpoints`, index);
  };

  return (
    <Group align="center">
      <TextInput
        placeholder="Endpoint URL"
        data-testid="input-endpoint"
        flex={1}
        required
        {...form.getInputProps(
          `apiOverrides.${chainIndex}.endpoints.${index}.url`,
        )}
      />
      <ActionIcon
        color="red"
        size="md"
        variant="subtle"
        onClick={onRemoveClick}
        data-testid="button-remove-endpoint"
      >
        <IconTrash size={16} />
      </ActionIcon>
    </Group>
  );
};
