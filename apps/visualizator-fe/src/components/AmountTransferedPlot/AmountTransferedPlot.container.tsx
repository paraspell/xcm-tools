import { messageCountsByDayQueryDocument } from '../../api/messages';
import AmountTransferedPlot from './AmountTransferedPlot';
import { getParachainId } from '../../utils/utils';
import { useSelectedParachain } from '../../context/SelectedParachain/useSelectedParachain';
import { FC } from 'react';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { Ecosystem } from '../../types/types';
import { Center, Loader } from '@mantine/core';

const now = Date.now();

type Props = {
  showMedian?: boolean;
};

const AmountTransferedPlotContainer: FC<Props> = ({ showMedian }) => {
  const { t } = useTranslation();
  const { parachains, dateRange } = useSelectedParachain();
  const [start, end] = dateRange;

  const { data, loading, error } = useQuery(messageCountsByDayQueryDocument, {
    variables: {
      paraIds: parachains.map(parachain => getParachainId(parachain, Ecosystem.POLKADOT)),
      startTime: start && end ? start.getTime() / 1000 : 1,
      endTime: start && end ? end.getTime() / 1000 : now
    }
  });

  if (loading) {
    return (
      <Center h="100%">
        <Loader size="xs" />
      </Center>
    );
  }

  if (error) {
    return <div>{t('error')}</div>;
  }

  return <AmountTransferedPlot counts={data?.messageCountsByDay ?? []} showMedian={showMedian} />;
};

export default AmountTransferedPlotContainer;
