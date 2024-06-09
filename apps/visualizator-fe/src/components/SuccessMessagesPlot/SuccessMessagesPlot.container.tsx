import { messageCountsQueryDocument } from '../../api/messages';
import { useGraphQL } from '../../hooks/useGraphQL';
import SuccessMessagesPlot from './SuccessMessagesPlot';
import { getParachainId } from '../../utils/utils';
import { useSelectedParachain } from '../../context/SelectedParachain/useSelectedParachain';

const now = Date.now();

const SuccessMessagesPlotContainer = () => {
  const { parachains, dateRange } = useSelectedParachain();

  const [start, end] = dateRange;

  const { data, error } = useGraphQL(messageCountsQueryDocument, {
    paraIds: parachains.map(parachain => getParachainId(parachain)),
    startTime: start && end ? start.getTime() / 1000 : 1,
    endTime: start && end ? end.getTime() / 1000 : now
  });

  if (error) {
    return <div>Error</div>;
  }

  return <SuccessMessagesPlot counts={data?.messageCounts ?? []} />;
};

export default SuccessMessagesPlotContainer;
