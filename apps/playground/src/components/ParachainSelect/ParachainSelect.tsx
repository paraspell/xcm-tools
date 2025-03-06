import type { SelectProps } from '@mantine/core';
import { Group, Image, Select } from '@mantine/core';
import type { TNodePolkadotKusama } from '@paraspell/sdk-pjs';
import { IconCheck } from '@tabler/icons-react';
import type { FC } from 'react';

import { getParachainIcon } from '../../utils/getParachainIcon';

const iconProps = {
  stroke: 1.5,
  color: 'currentColor',
  opacity: 0.6,
  size: 18,
};

const renderSelectOption: SelectProps['renderOption'] = ({
  option,
  checked,
}) => {
  const icon = getParachainIcon(option.value as TNodePolkadotKusama);
  return (
    <Group flex="1" gap="xs">
      <Image src={icon} width={16} height={16} radius="xl" alt={option.label} />
      {option.label}
      {checked && (
        <IconCheck style={{ marginInlineStart: 'auto' }} {...iconProps} />
      )}
    </Group>
  );
};

type Props = SelectProps;

export const ParachainSelect: FC<Props> = (props) => {
  const { value } = props;
  const icon = getParachainIcon(value as TNodePolkadotKusama);
  return (
    <Select
      placeholder="Pick value"
      renderOption={renderSelectOption}
      leftSection={
        icon ? <Image src={icon} width={16} height={16} radius="xl" /> : null
      }
      nothingFoundMessage="Nothing found..."
      allowDeselect={false}
      searchable
      required
      {...props}
    />
  );
};
