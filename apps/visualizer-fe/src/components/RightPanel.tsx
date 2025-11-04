import { Flex, Stack } from '@mantine/core';
import { animated, useSpring } from '@react-spring/web';
import { useState } from 'react';

import { useDeviceType } from '../context/DeviceType/useDeviceType';
import { PageRoute } from '../PageRoute';
import CollapseButton from './CollapseButton';
import TabNavigator from './TabNavigator/TabNavigator';

const AnimatedDiv = animated('div');

const RightPanel = () => {
  const { isMobile } = useDeviceType();

  const panelWidth = isMobile ? '100%' : '40%';
  const [collapsed, setCollapsed] = useState(isMobile);

  const slideStyles = useSpring({
    transform: collapsed ? 'translateX(100%)' : 'translateX(0%)',
    config: {
      tension: 170,
      friction: 26
    }
  });

  return (
    <div
      style={{
        width: collapsed ? 0 : panelWidth,
        flexShrink: 0,
        height: '100%',
        position: isMobile ? 'absolute' : 'relative',
        right: 0,
        top: 0,
        zIndex: isMobile ? 10 : 1,
        overflow: 'visible',
        display: 'flex'
      }}
    >
      <CollapseButton
        onClick={() => setCollapsed(v => !v)}
        isCollapsed={collapsed}
        isMobile={isMobile}
        slideStyles={slideStyles}
      />

      <AnimatedDiv
        style={{
          ...slideStyles,
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          background: 'white',
          willChange: 'transform'
        }}
      >
        <Stack h="100%" w="100%">
          <Flex flex={1} mih={0}>
            <TabNavigator defaultValue={PageRoute.SCENE_2D_ASSETS_CHART} />
          </Flex>

          {!isMobile && (
            <Flex flex={1} mih={0}>
              <TabNavigator />
            </Flex>
          )}
        </Stack>
      </AnimatedDiv>
    </div>
  );
};

export default RightPanel;
