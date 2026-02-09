import { Group } from '@mantine/core';

import { useSelectedParachain } from '../context/SelectedParachain/useSelectedParachain';
import { Scene3d } from '../pages/Scene3d';
import { ChannelAlertContainer } from './ChannelInfo/ChannelAlert.container';
import { EcosystemSelectContainer } from './EcosystemSelect/EcosystemSelect.container';
import { Footer } from './Footer/Footer';

export const LeftPanel = () => {
  const { selectedChannel } = useSelectedParachain();
  return (
    <Group flex={1} w="60%" h="100%" pos="relative">
      <Scene3d />
      <Footer />
      {selectedChannel && <ChannelAlertContainer selectedChannel={selectedChannel} />}
      <EcosystemSelectContainer />
    </Group>
  );
};
