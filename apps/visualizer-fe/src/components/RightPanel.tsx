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

  const [open, setOpen] = useState(!isMobile);
  const toggleWidth = () => setOpen(v => !v);

  // Only animate translateX. No width animation.
  const springs = useSpring({
    x: open ? 0 : 1, // 0 = visible, 1 = slid out
    config: { tension: 230, friction: 26 }
  });

  // Constant width for the panel itself
  const panelWidth = isMobile ? '100%' : '40%';

  return (
    <>
      {/* The handle is a sibling positioned against the parent container */}
      <CollapseButton onClick={toggleWidth} isCollapsed={!open} isMobile={isMobile} />

      <AnimatedDiv
        style={{
          position: 'absolute', // parent <Flex> must be pos="relative"
          right: 0,
          top: 0,
          height: '100%',
          width: panelWidth,
          transform: springs.x.to(v => `translateX(${v * 100}%)`),
          willChange: 'transform',
          contain: 'layout paint size',
          zIndex: 1,
          pointerEvents: isMobile ? (open ? 'auto' : 'none') : 'auto',
          overflow: 'hidden',
          background: 'white'
        }}
      >
        <Stack h="100%" w="100%" pos="relative" bg="white">
          <Flex
            flex={1}
            w="100%"
            h="50%"
            pl={10}
            mih={0}
            justify="center"
            align="stretch"
            style={{ overflow: 'hidden' }}
          >
            <TabNavigator defaultValue={PageRoute.SCENE_2D_ASSETS_CHART} />
          </Flex>

          {!isMobile && (
            <Flex
              flex={1}
              w="100%"
              h="50%"
              pl={10}
              mih={0}
              justify="center"
              align="stretch"
              style={{ overflow: 'hidden' }}
            >
              <TabNavigator />
            </Flex>
          )}
        </Stack>
      </AnimatedDiv>
    </>
  );
};

export default RightPanel;
