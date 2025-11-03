import { useQuery } from '@apollo/client/react';
import type { FC } from 'react';

import { allChannelsQueryDocument } from '../../api/channels';
import { totalMessageCountsQueryDocument } from '../../api/messages';
import { useDeviceType } from '../../context/DeviceType/useDeviceType';
import { useSelectedParachain } from '../../context/SelectedParachain/useSelectedParachain';
import { CountOption } from '../../gql/graphql';
import type { Ecosystem } from '../../types/types';
import ParachainsGraph from './ParachainsGraph';

const now = Date.now();

type Props = {
  ecosystem: Ecosystem;
};

const ParachainsGraphContainer: FC<Props> = ({ ecosystem }) => {
  const { dateRange, parachainArrangement } = useSelectedParachain();
  const { selectedEcosystem } = useSelectedParachain();
  const { isTouch } = useDeviceType();

  const [start, end] = dateRange;

  const { data } = useQuery(allChannelsQueryDocument, {
    variables: {
      ecosystem: ecosystem.toString().toLowerCase()
    }
  });
  const totalCountsQuery = useQuery(totalMessageCountsQueryDocument, {
    variables: {
      ecosystem: ecosystem.toString().toLowerCase(),
      startTime: start && end ? start.getTime() / 1000 : 1,
      endTime: start && end ? end.getTime() / 1000 : now,
      countBy: parachainArrangement ?? CountOption.ORIGIN
    }
  });

  // on touch devices, only show the selected ecosystem
  const isVisible = !isTouch || ecosystem === selectedEcosystem;

  if (data && totalCountsQuery.data && isVisible) {
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
