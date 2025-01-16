import type { FC } from 'react';
import type { CheckboxProps } from '@mantine/core';
import { Anchor, Checkbox } from '@mantine/core';

type Props = CheckboxProps;

export const XcmApiCheckbox: FC<Props> = (props) => (
  <Checkbox
    label={
      <>
        Use{' '}
        <Anchor href="https://lightspell.xyz/" target="_blank" inherit>
          XCM API ⚡️
        </Anchor>
      </>
    }
    data-testid="checkbox-api"
    {...props}
  />
);
