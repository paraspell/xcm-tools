import { ActionIcon } from '@mantine/core';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { FC } from 'react';

type Props = {
  onClick: () => void;
  isCollapsed: boolean;
};

const CollapseButton: FC<Props> = ({ onClick, isCollapsed }) => (
  <ActionIcon
    onClick={onClick}
    variant="default"
    pos="absolute"
    left={0}
    top="50%"
    style={{
      transform: 'translate(-100%, -50%)',
      borderTopRightRadius: 0,
      borderBottomRightRadius: 0,
      borderWidth: 0,
      height: 40,
      width: 20,
      minHeight: 1,
      minWidth: 1
    }}
  >
    {isCollapsed ? <IconChevronLeft size={24} /> : <IconChevronRight size={24} />}
  </ActionIcon>
);

export default CollapseButton;
