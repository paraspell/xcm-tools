import { Flex, Stack } from '@mantine/core';
import type { SpringValue } from '@react-spring/web';
import { animated } from '@react-spring/web';

import { useDeviceType } from '../context/DeviceType/useDeviceType';
import { PageRoute } from '../PageRoute';
import CollapseButton from './CollapseButton';
import TabNavigator from './TabNavigator/TabNavigator';

const AnimatedDiv = animated('div');

interface RightPanelProps {
  animatedStyle: { rightTranslate: SpringValue<string> };
  toggle: () => void;
  collapsed: boolean;
  panelWidth: string | number;
}

const RightPanel = ({ animatedStyle, toggle, collapsed, panelWidth }: RightPanelProps) => {
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
          <TabNavigator defaultValue={PageRoute.SCENE_2D_ASSETS_CHART} />
        </Flex>

        {!isMobile && (
          <Flex flex={1} w="100%" h="50%" pl={10} mih={0} justify="center" align="stretch">
            <TabNavigator />
          </Flex>
        )}
      </Stack>
    </AnimatedDiv>
  );
};

export default RightPanel;
