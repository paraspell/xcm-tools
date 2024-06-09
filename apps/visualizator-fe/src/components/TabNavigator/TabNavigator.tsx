import { Tabs, rem } from '@mantine/core';
import { PageRoute } from '../../PageRoute';
import { IconAsset, IconChartBubble, IconCheck, IconClock } from '@tabler/icons-react';
import Scene2dMessagesStatus from '../../pages/Scene2dMessagesStatus';
import Scene2dAssetsChart from '../../pages/Scene2dAssetsChart';
import Scene2dAmountsByDay from '../../pages/Scene2dAmountsByDay';
import Scene2dBubblePlot from '../../pages/Scene2dBubblePlot';

const TabNavigator = () => {
  const iconStyle = { width: rem(12), height: rem(12) };
  return (
    <Tabs
      defaultValue={PageRoute.SCENE_2D_MSG_SUCCESS_CHART}
      variant="pills"
      p="md"
      w="100%"
      style={{ display: 'flex', flexDirection: 'column' }}
    >
      <Tabs.List grow pb="lg" w="100%">
        <Tabs.Tab
          value={PageRoute.SCENE_2D_MSG_SUCCESS_CHART}
          leftSection={<IconCheck style={iconStyle} />}
        >
          Success
        </Tabs.Tab>
        <Tabs.Tab
          value={PageRoute.SCENE_2D_ASSETS_CHART}
          leftSection={<IconAsset style={iconStyle} />}
        >
          Assets
        </Tabs.Tab>
        <Tabs.Tab
          value={PageRoute.SCENE_2D_AMOUNTS_BY_DAY}
          leftSection={<IconClock style={iconStyle} />}
        >
          Amounts
        </Tabs.Tab>
        <Tabs.Tab
          value={PageRoute.SCENE_2D_BUBBLE_PLOT}
          leftSection={<IconChartBubble style={iconStyle} />}
        >
          Accounts
        </Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value={PageRoute.SCENE_2D_MSG_SUCCESS_CHART}>
        <Scene2dMessagesStatus />
      </Tabs.Panel>
      <Tabs.Panel value={PageRoute.SCENE_2D_ASSETS_CHART}>
        <Scene2dAssetsChart />
      </Tabs.Panel>
      <Tabs.Panel value={PageRoute.SCENE_2D_AMOUNTS_BY_DAY}>
        <Scene2dAmountsByDay />
      </Tabs.Panel>
      <Tabs.Panel value={PageRoute.SCENE_2D_BUBBLE_PLOT}>
        <Scene2dBubblePlot />
      </Tabs.Panel>
    </Tabs>
  );
};

export default TabNavigator;
