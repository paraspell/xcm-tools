import { type FC } from 'react';
import { allChannelsQueryDocument } from '../../api/channels';
import { totalMessageCountsQueryDocument } from '../../api/messages';
import { useSelectedParachain } from '../../context/SelectedParachain/useSelectedParachain';
import { CountOption } from '../../gql/graphql';
import { type Ecosystem } from '../../types/types';
import ParachainsGraph from './ParachainsGraph';
import { useQuery } from '@apollo/client';

const now = Date.now();

type Props = {
  ecosystem: Ecosystem;
};

const ParachainsGraphContainer: FC<Props> = ({ ecosystem }) => {
  const { dateRange, parachainArrangement } = useSelectedParachain();

  const [start, end] = dateRange;

  const { data } = useQuery(allChannelsQueryDocument, {
    variables: {
      startTime: start && end ? start.getTime() / 1000 : 1,
      endTime: start && end ? end.getTime() / 1000 : now
    }
  });
  const totalCountsQuery = useQuery(totalMessageCountsQueryDocument, {
    variables: {
      startTime: start && end ? start.getTime() / 1000 : 1,
      endTime: start && end ? end.getTime() / 1000 : now,
      countBy: parachainArrangement ?? CountOption.ORIGIN
    }
  });

  if (data && totalCountsQuery.data) {
    return (
      <ParachainsGraph
        channels={data.channels}
        totalMessageCounts={totalCountsQuery.data?.totalMessageCounts}
        ecosystem={ecosystem}
      />
    );
  }

  return <></>;
};

export default ParachainsGraphContainer;
