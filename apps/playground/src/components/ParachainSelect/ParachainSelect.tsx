import type { ComboboxItem } from '@mantine/core';
import { Group, Image } from '@mantine/core';
import { isChain } from '@paraspell/sdk';
import { IconCheck } from '@tabler/icons-react';
import type { FC } from 'react';

import { getParachainIcon } from '../../utils/getParachainIcon';
import type { ComboboxSelectProps } from '../common/ComboboxSelect';
import { ComboboxSelect } from '../common/ComboboxSelect';

const getIconFor = (chain?: string | null) => {
  if (!chain) return null;
  if (!isChain(chain)) return '/circle.svg';
  return getParachainIcon(chain);
};

const ChainIcon: FC<{ chain?: string | null; alt?: string }> = ({
  chain,
  alt,
}) => {
  const src = getIconFor(chain);
  if (!src) return null;
  return (
    <Image
      src={src}
      style={{ width: '16px', height: '16px' }}
      radius="xl"
      alt={alt}
    />
  );
};

const renderChainOption = ({
  option,
  checked,
}: {
  option: ComboboxItem;
  checked?: boolean;
}) => (
  <Group flex="1" gap="xs">
    <ChainIcon chain={option.value} alt={option.label} />
    {option.label}
    {checked && (
      <IconCheck
        style={{ marginInlineStart: 'auto' }}
        stroke={1.5}
        color="currentColor"
        opacity={0.6}
        size={18}
      />
    )}
  </Group>
);

type Props = Omit<
  ComboboxSelectProps,
  'addCustomLabel' | 'addCustomTestId' | 'withAsterisk'
>;

export const ParachainSelect: FC<Props> = ({
  value,
  leftSection,
  ...props
}) => (
  <ComboboxSelect
    {...props}
    value={value}
    leftSection={
      leftSection ?? (
        <ChainIcon chain={typeof value === 'string' ? value : null} />
      )
    }
    renderOption={renderChainOption}
    withAsterisk={false}
    addCustomLabel="Add custom chain"
    addCustomTestId="button-add-custom-chain"
  />
);
