import { assetCountsBySymbolQueryDocument } from '../../api/messages';
import AssetsTransferedPlot from './AssetsTransferedPlot';
import { getParachainId } from '../../utils/utils';
import { useSelectedParachain } from '../../context/SelectedParachain/useSelectedParachain';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { Ecosystem } from '../../types/types';

const now = Date.now();

const AssetsTransferedPlotContainer = () => {
  const { t } = useTranslation();
  const { parachains, dateRange } = useSelectedParachain();

  const [start, end] = dateRange;

  const { data, error } = useQuery(assetCountsBySymbolQueryDocument, {
    variables: {
      paraIds: parachains.map(parachain => getParachainId(parachain, Ecosystem.POLKADOT)),
      startTime: start && end ? start.getTime() / 1000 : 1,
      endTime: start && end ? end.getTime() / 1000 : now
    }
  });

  if (error) {
    return <div>{t('error')}</div>;
  }

  return <AssetsTransferedPlot counts={data?.assetCountsBySymbol ?? []} />;
};

export default AssetsTransferedPlotContainer;
