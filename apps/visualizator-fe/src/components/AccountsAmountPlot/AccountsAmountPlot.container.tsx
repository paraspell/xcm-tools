import { accountXcmCountsQueryDocument } from '../../api/messages';
import { useGraphQL } from '../../hooks/useGraphQL';
import { FC } from 'react';
import AccountsAmountPlot from './AccountsAmountPlot';
import { useSelectedParachain } from '../../context/SelectedParachain/useSelectedParachain';
import { getParachainId } from '../../utils/utils';

const now = Date.now();

type Props = {
  threshold: number;
};

const AccountsAmountPlotContainer: FC<Props> = ({ threshold }) => {
  const { parachains, dateRange } = useSelectedParachain();

  const [start, end] = dateRange;

  const { data, error } = useGraphQL(accountXcmCountsQueryDocument, {
    threshold,
    paraIds: parachains.map(parachain => getParachainId(parachain)),
    startTime: start && end ? start.getTime() / 1000 : 1,
    endTime: start && end ? end.getTime() / 1000 : now
  });

  if (error) {
    return <div>Error</div>;
  }

  return <AccountsAmountPlot counts={data?.accountCounts ?? []} />;
};

export default AccountsAmountPlotContainer;
