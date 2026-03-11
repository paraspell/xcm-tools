import { Flex } from '@mantine/core';
import { useSpring } from '@react-spring/web';
import { useState } from 'react';

import { useDeviceType } from '../context/DeviceType/useDeviceType';
import { LeftPanel } from './LeftPanel';
import { RightPanel } from './RightPanel';

export const MainContentPanel = () => {
  const { isMobile } = useDeviceType();
  const [collapsed, setCollapsed] = useState(isMobile);

  const rightPanelWidth = isMobile ? '100%' : '40%';

  const spring = useSpring({
    leftWidth: collapsed ? '100%' : '60%',
    rightTranslate: collapsed ? '100%' : '0%',
    config: { tension: 300, friction: 30 }
  });

  const toggle = () => setCollapsed(v => !v);

  return (
    <Flex h="100%" w="100%" pos="relative" style={{ overflow: 'hidden' }}>
      <LeftPanel animatedStyle={spring} />
      <RightPanel
        animatedStyle={spring}
        toggle={toggle}
        collapsed={collapsed}
        panelWidth={rightPanelWidth}
      />
    </Flex>
  );
};
