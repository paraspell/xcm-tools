import { type FC } from 'react';
import { MultiSelect, type MultiSelectProps } from '@mantine/core';
import { type SelectedParachain } from '../context/SelectedParachain/SelectedParachainContext';
import { useTranslation } from 'react-i18next';
import { getNodesByEcosystem } from '../utils/utils';
import { Ecosystem } from '../types/types';

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
      data={[...getNodesByEcosystem(Ecosystem.POLKADOT), 'Polkadot']}
      onChange={onChangeInternal}
      searchable
      {...props}
    />
  );
};

export default ParachainSelector;
