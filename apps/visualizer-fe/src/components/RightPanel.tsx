import { Flex, Stack } from '@mantine/core';
import type { SpringValue } from '@react-spring/web';
import { animated } from '@react-spring/web';
import { memo } from 'react';

import { useDeviceType } from '../context/DeviceType/useDeviceType';
import { PageRoute } from '../PageRoute';
import { CollapseButton } from './CollapseButton';
import { TabNavigator } from './TabNavigator/TabNavigator';

const AnimatedDiv = animated('div');
const MemoTabNavigator = memo(TabNavigator);

interface RightPanelProps {
  animatedStyle: { rightTranslate: SpringValue<string> };
  toggle: () => void;
  collapsed: boolean;
  panelWidth: string | number;
}

export const RightPanel = ({ animatedStyle, toggle, collapsed, panelWidth }: RightPanelProps) => {
  const { isMobile } = useDeviceType();

  return (
    <AnimatedDiv
      style={{
        transform: animatedStyle.rightTranslate.to((v: string) => `translateX(${v})`),
        position: 'absolute',
        right: 0,
        top: 0,
        height: '100%',
        width: panelWidth,
        zIndex: 10,
        willChange: 'transform'
      }}
    >
      <Stack h="100%" w="100%" pos="relative" bg="white">
        <CollapseButton onClick={toggle} isCollapsed={collapsed} isMobile={isMobile} />

        <Flex flex={1} w="100%" h="50%" pl={10} mih={0} justify="center" align="stretch">
          <MemoTabNavigator defaultValue={PageRoute.SCENE_2D_ASSETS_CHART} />
        </Flex>

        {!isMobile && (
          <Flex flex={1} w="100%" h="50%" pl={10} mih={0} justify="center" align="stretch">
            <MemoTabNavigator />
          </Flex>
        )}
      </Stack>
    </AnimatedDiv>
  );
};
