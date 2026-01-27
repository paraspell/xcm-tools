import { Flex } from '@mantine/core';

import LeftPanel from './LeftPanel';
import RightPanel from './RightPanel';

export default function MainContentPanel() {
  return (
    <Flex h="100%" w="100%" pos="relative" style={{ overflow: 'hidden' }}>
      <LeftPanel />
      <RightPanel />
    </Flex>
  );
}
