import { messageCountsQueryDocument } from '../../api/messages';
import SuccessMessagesPlot from './SuccessMessagesPlot';
import { getParachainId } from '../../utils/utils';
import { useSelectedParachain } from '../../context/SelectedParachain/useSelectedParachain';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';

const now = Date.now();

const SuccessMessagesPlotContainer = () => {
  const { t } = useTranslation();
  const { parachains, dateRange } = useSelectedParachain();

  const [start, end] = dateRange;

  const { data, error } = useQuery(messageCountsQueryDocument, {
    variables: {
      paraIds: parachains.map(parachain => getParachainId(parachain)),
      startTime: start && end ? start.getTime() / 1000 : 1,
      endTime: start && end ? end.getTime() / 1000 : now
    }
  });

  if (error) {
    return <div>{t('error')}</div>;
  }

  return <SuccessMessagesPlot counts={data?.messageCounts ?? []} />;
};

export default SuccessMessagesPlotContainer;
