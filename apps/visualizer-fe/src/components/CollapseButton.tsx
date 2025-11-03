import { ActionIcon } from '@mantine/core';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import type { FC } from 'react';

type Props = {
  onClick: () => void;
  isCollapsed: boolean;
  isMobile: boolean;
};

const CollapseButton: FC<Props> = ({ onClick, isCollapsed, isMobile }) => (
  <ActionIcon
    onClick={onClick}
    variant="default"
    pos="absolute"
    left={0}
    top="50%"
    h={isCollapsed ? 50 : 100}
    w={20}
    mih={1}
    miw={1}
    style={{
      transform: isCollapsed || !isMobile ? 'translate(-100%, -50%)' : 'translate(0, -50%)',
      borderTopRightRadius: 0,
      borderBottomRightRadius: 0,
      borderWidth: 0,
      zIndex: 69
    }}
  >
    {isCollapsed ? <IconChevronLeft size={24} /> : <IconChevronRight size={24} />}
  </ActionIcon>
);

export default CollapseButton;
