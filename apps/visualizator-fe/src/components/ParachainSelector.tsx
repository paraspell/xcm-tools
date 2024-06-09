import { FC } from 'react';
import { MultiSelect, MultiSelectProps } from '@mantine/core';
import { POLKADOT_NODE_NAMES } from '../consts';
import { SelectedParachain } from '../context/SelectedParachain/SelectedParachainContext';

type Props = MultiSelectProps & {
  value: SelectedParachain[];
  onCustomChange: (parachain: SelectedParachain[]) => void;
};

const ParachainSelector: FC<Props> = ({ onCustomChange, ...props }) => {
  const onChangeInternal = (values: string[]) => {
    if (values) {
      onCustomChange(values as SelectedParachain[]);
    }
  };

  return (
    <MultiSelect
      label="Parachains"
      placeholder="Select one"
      data={[...POLKADOT_NODE_NAMES, 'Polkadot']}
      onChange={onChangeInternal}
      searchable
      {...props}
    />
  );
};

export default ParachainSelector;
