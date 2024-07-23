import { accountXcmCountsQueryDocument } from '../../api/messages';
import { FC } from 'react';
import AccountsAmountPlot from './AccountsAmountPlot';
import { useSelectedParachain } from '../../context/SelectedParachain/useSelectedParachain';
import { getParachainId } from '../../utils/utils';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { Ecosystem } from '../../types/types';

const now = Date.now();

type Props = {
  threshold: number;
};

const AccountsAmountPlotContainer: FC<Props> = ({ threshold }) => {
  const { t } = useTranslation();
  const { parachains, dateRange } = useSelectedParachain();

  const [start, end] = dateRange;

  const { data, error } = useQuery(accountXcmCountsQueryDocument, {
    variables: {
      threshold,
      paraIds: parachains.map(parachain => getParachainId(parachain, Ecosystem.POLKADOT)),
      startTime: start && end ? start.getTime() / 1000 : 1,
      endTime: start && end ? end.getTime() / 1000 : now
    }
  });

  if (error) {
    return <div>{t('error')}</div>;
  }

  return <AccountsAmountPlot counts={data?.accountCounts ?? []} />;
};

export default AccountsAmountPlotContainer;
