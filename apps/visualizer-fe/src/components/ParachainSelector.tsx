import type { MultiSelectProps } from '@mantine/core';
import { MultiSelect } from '@mantine/core';
import { SUBSTRATE_CHAINS, type TSubstrateChain } from '@paraspell/sdk';
import type { FC } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { getChainDisplayName } from '../utils';

type Props = MultiSelectProps & {
  value: TSubstrateChain[];
  onCustomChange: (parachain: TSubstrateChain[]) => void;
};

const ParachainSelector: FC<Props> = ({ onCustomChange, ...props }) => {
  const { t } = useTranslation();

  const data = useMemo(
    () =>
      SUBSTRATE_CHAINS.map(item => ({
        value: item,
        label: getChainDisplayName(item)
      })),
    []
  );

  const onChangeInternal = (values: string[]) => {
    if (values) onCustomChange(values as TSubstrateChain[]);
  };

  return (
    <MultiSelect
      label={t('main.taxonomy.parachains')}
      placeholder={t('filters.select')}
      data={data}
      onChange={onChangeInternal}
      searchable
      clearable
      {...props}
      miw="85px"
    />
  );
};

export default ParachainSelector;
