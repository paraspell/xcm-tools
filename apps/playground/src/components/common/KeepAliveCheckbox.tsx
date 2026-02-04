import type { CheckboxProps } from '@mantine/core';
import { Checkbox, Group } from '@mantine/core';
import { IconActivityHeartbeat } from '@tabler/icons-react';
import type { FC } from 'react';

export const KeepAliveCheckbox: FC<CheckboxProps> = (props) => {
  const iconColor = props.disabled
    ? 'var(--mantine-color-dimmed)'
    : 'var(--mantine-primary-color-3)';

  return (
    <Checkbox
      label={
        <Group gap={4}>
          Keep Alive
          <IconActivityHeartbeat color={iconColor} size={22} stroke={1.5} />
        </Group>
      }
      data-testid="checkbox-keep-alive"
      {...props}
    />
  );
};
