import { Container, Tabs, rem } from "@mantine/core";
import {
  IconArrowsUpDown,
  IconBoxAlignBottomRight,
  IconCoins,
  IconSend,
} from "@tabler/icons-react";
import XcmTransfer from "../components/XcmTransfer";
import AssetsQueries from "../components/assets/AssetsQueries";
import PalletsQueries from "../components/pallets/PalletsQueries";
import ChannelsQueries from "../components/channels/ChannelsQueries";

const XcmSdkSandbox = () => {
  const iconStyle = { width: rem(12), height: rem(12) };

  return (
    <Tabs defaultValue="xcm-transfer">
      <Tabs.List>
        <Tabs.Tab
          value="xcm-transfer"
          leftSection={<IconSend style={iconStyle} />}
        >
          XCM Transfer
        </Tabs.Tab>
        <Tabs.Tab value="assets" leftSection={<IconCoins style={iconStyle} />}>
          Assets
        </Tabs.Tab>
        <Tabs.Tab
          value="pallets"
          leftSection={<IconBoxAlignBottomRight style={iconStyle} />}
        >
          Pallets
        </Tabs.Tab>
        <Tabs.Tab
          value="hrmp-channels"
          leftSection={<IconArrowsUpDown style={iconStyle} />}
        >
          HRMP Channels
        </Tabs.Tab>
      </Tabs.List>

      <Container p="xl">
        <Tabs.Panel value="xcm-transfer">
          <XcmTransfer />
        </Tabs.Panel>

        <Tabs.Panel value="assets">
          <AssetsQueries />
        </Tabs.Panel>

        <Tabs.Panel value="pallets">
          <PalletsQueries />
        </Tabs.Panel>

        <Tabs.Panel value="hrmp-channels">
          <ChannelsQueries />
        </Tabs.Panel>
      </Container>
    </Tabs>
  );
};

export default XcmSdkSandbox;
