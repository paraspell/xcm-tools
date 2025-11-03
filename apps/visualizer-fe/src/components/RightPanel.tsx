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

  const [width, setWidth] = useState(isMobile ? '0%' : '40%');
  const props = useSpring({ width });

  const toggleWidth = () => {
    const maxWidth = isMobile ? '100%' : '40%';
    setWidth(width === '0%' ? maxWidth : '0%');
  };

  const isCollapsed = width === '0%';

  return (
    <AnimatedDiv
      style={{
        ...props,
        position: isMobile ? 'absolute' : 'relative',
        right: 0,
        top: 0,
        height: '100%',
        zIndex: isMobile ? 10 : 1
      }}
    >
      <Stack h="100%" w="100%" pos="relative" bg="white">
        <CollapseButton onClick={toggleWidth} isCollapsed={isCollapsed} isMobile={isMobile} />
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
  );
};

export default RightPanel;
