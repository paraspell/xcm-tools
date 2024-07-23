import { messageCountsByDayQueryDocument } from '../../api/messages';
import AmountTransferedPlot from './AmountTransferedPlot';
import { getParachainId } from '../../utils/utils';
import { useSelectedParachain } from '../../context/SelectedParachain/useSelectedParachain';
import { FC } from 'react';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { Ecosystem } from '../../types/types';

const now = Date.now();

type Props = {
  showMedian?: boolean;
};

const AmountTransferedPlotContainer: FC<Props> = ({ showMedian }) => {
  const { t } = useTranslation();
  const { parachains, dateRange } = useSelectedParachain();
  const [start, end] = dateRange;

  const { data, error } = useQuery(messageCountsByDayQueryDocument, {
    variables: {
      paraIds: parachains.map(parachain => getParachainId(parachain, Ecosystem.POLKADOT)),
      startTime: start && end ? start.getTime() / 1000 : 1,
      endTime: start && end ? end.getTime() / 1000 : now
    }
  });

  if (error) {
    return <div>{t('error')}</div>;
  }

  return <AmountTransferedPlot counts={data?.messageCountsByDay ?? []} showMedian={showMedian} />;
};

export default AmountTransferedPlotContainer;
