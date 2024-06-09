import { Container, Tabs, rem } from "@mantine/core";
import {
  IconArrowsUpDown,
  IconBoxAlignBottomRight,
  IconCoins,
  IconSend,
  IconSend2,
  IconWallet,
} from "@tabler/icons-react";
import XcmTransfer from "../components/XcmTransfer";
import AssetsQueries from "../components/assets/AssetsQueries";
import PalletsQueries from "../components/pallets/PalletsQueries";
import ChannelsQueries from "../components/channels/ChannelsQueries";
import TransferInfo from "../components/TransferInfo";
import AssetClaim from "../components/asset-claim/AssetClaim";

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

        <Tabs.Tab
          value="transfer-info"
          leftSection={<IconSend2 style={iconStyle} />}
        >
          Transfer Info
        </Tabs.Tab>

        <Tabs.Tab
          value="asset-claim"
          leftSection={<IconWallet style={iconStyle} />}
        >
          Asset Claim
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

        <Tabs.Panel value="transfer-info">
          <TransferInfo />
        </Tabs.Panel>

        <Tabs.Panel value="asset-claim">
          <AssetClaim />
        </Tabs.Panel>
      </Container>
    </Tabs>
  );
};

export default XcmSdkSandbox;
