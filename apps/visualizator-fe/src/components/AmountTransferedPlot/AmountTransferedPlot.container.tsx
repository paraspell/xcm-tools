import { messageCountsByDayQueryDocument } from '../../api/messages';
import { useGraphQL } from '../../hooks/useGraphQL';
import AmountTransferedPlot from './AmountTransferedPlot';
import { getParachainId } from '../../utils/utils';
import { useSelectedParachain } from '../../context/SelectedParachain/useSelectedParachain';
import { FC } from 'react';

const now = Date.now();

type Props = {
  showMedian?: boolean;
};

const AmountTransferedPlotContainer: FC<Props> = ({ showMedian }) => {
  const { parachains, dateRange } = useSelectedParachain();
  const [start, end] = dateRange;

  const { data, error } = useGraphQL(messageCountsByDayQueryDocument, {
    paraIds: parachains.map(parachain => getParachainId(parachain)),
    startTime: start && end ? start.getTime() / 1000 : 1,
    endTime: start && end ? end.getTime() / 1000 : now
  });

  if (error) {
    return <div>Error</div>;
  }

  return <AmountTransferedPlot counts={data?.messageCountsByDay ?? []} showMedian={showMedian} />;
};

export default AmountTransferedPlotContainer;
