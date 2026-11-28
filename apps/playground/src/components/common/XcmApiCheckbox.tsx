import type { CheckboxProps } from '@mantine/core';
import { Anchor, Checkbox } from '@mantine/core';
import { SITE_URL } from '@paraspell/ui';
import type { FC } from 'react';

export const XcmApiCheckbox: FC<CheckboxProps> = (props) => (
  <Checkbox
    label={
      <>
        Use{' '}
        <Anchor href={SITE_URL} target="_blank" inherit>
          XCM API ⚡️
        </Anchor>
      </>
    }
    data-testid="checkbox-api"
    {...props}
  />
);
