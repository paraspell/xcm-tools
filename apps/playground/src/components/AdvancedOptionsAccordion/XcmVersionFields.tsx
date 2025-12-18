import { Group, Select, Stack, TextInput } from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';
import { Version } from '@paraspell/sdk';
import type { FC } from 'react';

import type { AdvancedOptions } from './AdvancedOptionsAccordion';

type Props = {
  form: UseFormReturnType<AdvancedOptions>;
};

export const XcmVersionFields: FC<Props> = ({ form }) => {
  return (
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
  );
};
