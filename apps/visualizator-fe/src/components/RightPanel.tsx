import { Stack, Flex } from '@mantine/core';
import { animated, useSpring } from '@react-spring/web';
import { PageRoute } from '../PageRoute';
import CollapseButton from './CollapseButton';
import TabNavigator from './TabNavigator/TabNavigator';
import { useState } from 'react';

const RightPanel = () => {
  const [width, setWidth] = useState('40%');
  const props = useSpring({ width });

  const toggleWidth = () => {
    setWidth(width === '40%' ? '0%' : '40%');
  };

  const isCollapsed = width === '0%';
  return (
    <animated.div style={props}>
      <Stack h="100%" w="100%" pos="relative" bg="white">
        <CollapseButton onClick={toggleWidth} isCollapsed={isCollapsed} />
        <Flex flex={1} w="100%" justify="center">
          <TabNavigator defaultValue={PageRoute.SCENE_2D_ASSETS_CHART} />
        </Flex>
        <Flex flex={1} w="100%" justify="center">
          <TabNavigator />
        </Flex>
      </Stack>
    </animated.div>
  );
};

export default RightPanel;
