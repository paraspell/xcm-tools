import type { MultiSelectProps } from '@mantine/core';
import { MultiSelect } from '@mantine/core';
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';

import type { SelectedParachain } from '../context/SelectedParachain/SelectedParachainContext';
import { Ecosystem } from '../types/types';
import { getChainsByEcosystem } from '../utils/utils';

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
      data={[...getChainsByEcosystem(Ecosystem.POLKADOT), 'Polkadot']}
      onChange={onChangeInternal}
      searchable
      {...props}
    />
  );
};

export default ParachainSelector;
