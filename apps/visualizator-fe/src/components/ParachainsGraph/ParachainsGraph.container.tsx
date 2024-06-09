import { allChannelsQueryDocument, channelQueryDocument } from '../../api/channels';
import { totalMessageCountsQueryDocument } from '../../api/messages';
import { useSelectedParachain } from '../../context/SelectedParachain/useSelectedParachain';
import { CountOption } from '../../gql/graphql';
import { useGraphQL } from '../../hooks/useGraphQL';
import ParachainsGraph from './ParachainsGraph';

const now = Date.now();

const ParachainsGraphContainer = () => {
  const { dateRange, channelId, parachainArrangement } = useSelectedParachain();

  const [start, end] = dateRange;

  const { data, error } = useGraphQL(allChannelsQueryDocument, {
    startTime: start && end ? start.getTime() / 1000 : 1,
    endTime: start && end ? end.getTime() / 1000 : now
  });
  const totalCountsQuery = useGraphQL(totalMessageCountsQueryDocument, {
    startTime: start && end ? start.getTime() / 1000 : 1,
    endTime: start && end ? end.getTime() / 1000 : now,
    countBy: parachainArrangement ?? CountOption.ORIGIN
  });

  const channelQuery = useGraphQL(channelQueryDocument, { id: channelId ?? 1 });

  if (data && totalCountsQuery.data) {
    return (
      <ParachainsGraph
        channels={data.channels}
        totalMessageCounts={totalCountsQuery.data?.totalMessageCounts}
        selectedChannel={channelQuery.data?.channel}
      />
    );
  }

  if (error) {
    return <></>;
  }

  return <></>;
};

export default ParachainsGraphContainer;
