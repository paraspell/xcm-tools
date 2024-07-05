import { FC } from 'react';
import { MultiSelect, MultiSelectProps } from '@mantine/core';
import { POLKADOT_NODE_NAMES } from '../consts';
import { SelectedParachain } from '../context/SelectedParachain/SelectedParachainContext';
import { useTranslation } from 'react-i18next';

type Props = MultiSelectProps & {
  value: SelectedParachain[];
  onCustomChange: (parachain: SelectedParachain[]) => void;
};

const ParachainSelector: FC<Props> = ({ onCustomChange, ...props }) => {
  const { t } = useTranslation();

  const onChangeInternal = (values: string[]) => {
    if (values) {
      onCustomChange(values);
    }
  };

  return (
    <MultiSelect
      label={t('parachains')}
      placeholder={t('selectOne')}
      data={[...POLKADOT_NODE_NAMES, 'Polkadot']}
      onChange={onChangeInternal}
      searchable
      {...props}
    />
  );
};

export default ParachainSelector;
