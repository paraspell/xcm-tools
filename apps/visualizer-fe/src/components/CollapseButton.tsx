import { ActionIcon } from '@mantine/core';
import type { SpringValue } from '@react-spring/web';
import { animated } from '@react-spring/web';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import type { FC } from 'react';

const AnimatedDiv = animated('div');

type Props = {
  onClick: () => void;
  isCollapsed: boolean;
  isMobile: boolean;
  slideStyles: { transform: SpringValue<string> };
};

const BUTTON_WIDTH = 20;

const CollapseButton: FC<Props> = ({ onClick, isCollapsed, isMobile, slideStyles }) => (
  <AnimatedDiv
    style={{
      ...slideStyles,
      position: 'absolute',
      top: '50%',
      left: isMobile && !isCollapsed ? 0 : -BUTTON_WIDTH,
      zIndex: 1000,
      transform: slideStyles.transform.to(t => {
        const compensate = isCollapsed ? `translateX(-${2 * BUTTON_WIDTH}px)` : '';
        return `${t} ${compensate}`;
      })
    }}
  >
    <ActionIcon
      onClick={onClick}
      variant="default"
      h={isCollapsed ? 50 : 100}
      w={BUTTON_WIDTH}
      style={{
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0,
        borderWidth: 0
      }}
    >
      {isCollapsed ? <IconChevronLeft size={24} /> : <IconChevronRight size={24} />}
    </ActionIcon>
  </AnimatedDiv>
);

export default CollapseButton;
