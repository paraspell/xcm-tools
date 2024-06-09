import { assetCountsBySymbolQueryDocument } from '../../api/messages';
import { useGraphQL } from '../../hooks/useGraphQL';
import AssetsTransferedPlot from './AssetsTransferedPlot';
import { getParachainId } from '../../utils/utils';
import { useSelectedParachain } from '../../context/SelectedParachain/useSelectedParachain';

const now = Date.now();

const AssetsTransferedPlotContainer = () => {
  const { parachains, dateRange } = useSelectedParachain();

  const [start, end] = dateRange;

  const { data, error } = useGraphQL(assetCountsBySymbolQueryDocument, {
    paraIds: parachains.map(parachain => getParachainId(parachain)),
    startTime: start && end ? start.getTime() / 1000 : 1,
    endTime: start && end ? end.getTime() / 1000 : now
  });

  if (error) {
    return <div>Error</div>;
  }

  return <AssetsTransferedPlot counts={data?.assetCountsBySymbol ?? []} />;
};

export default AssetsTransferedPlotContainer;
