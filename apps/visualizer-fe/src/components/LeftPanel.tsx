import { Group } from '@mantine/core';
import type { SpringValue } from '@react-spring/web';
import { animated } from '@react-spring/web';

import { useSelectedParachain } from '../context/SelectedParachain/useSelectedParachain';
import { Scene3d } from '../pages/Scene3d';
import { ChannelAlertContainer } from './ChannelInfo/ChannelAlert.container';
import { EcosystemSelectContainer } from './EcosystemSelect/EcosystemSelect.container';
import { Footer } from './Footer/Footer';

const AnimatedGroup = animated(Group);

interface LeftPanelProps {
  animatedStyle: {
    leftWidth: SpringValue<string>;
  };
}

export const LeftPanel = ({ animatedStyle }: LeftPanelProps) => {
  const { selectedChannel } = useSelectedParachain();

  return (
    <AnimatedGroup
      h="100%"
      pos="relative"
      style={{
        width: animatedStyle.leftWidth,
        minWidth: 0
      }}
    >
      <Scene3d />
      <Footer />
      {selectedChannel && <ChannelAlertContainer selectedChannel={selectedChannel} />}
      <EcosystemSelectContainer />
    </AnimatedGroup>
  );
};
