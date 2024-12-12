import { Container, Tabs, rem } from "@mantine/core";
import {
  IconBoxAlignBottomRight,
  IconCoins,
  IconSend,
  IconSend2,
  IconWallet,
} from "@tabler/icons-react";
import XcmTransfer from "../components/transfer/XcmTransfer";
import AssetsQueries from "../components/assets/AssetsQueries";
import PalletsQueries from "../components/pallets/PalletsQueries";
import TransferInfo from "../components/TransferInfo";
import AssetClaim from "../components/asset-claim/AssetClaim";
import EthBridgeTransfer from "../components/eth-bridge/EthBridgeTransfer";

const XcmSdkSandbox = () => {
  const iconStyle = { width: rem(12), height: rem(12) };

  return (
    <Tabs defaultValue="xcm-transfer" keepMounted={false}>
      <Tabs.List>
        <Tabs.Tab
          value="xcm-transfer"
          leftSection={<IconSend style={iconStyle} />}
        >
          XCM Transfer
        </Tabs.Tab>
        <Tabs.Tab
          value="assets"
          leftSection={<IconCoins style={iconStyle} />}
          data-testid="tab-assets"
        >
          Assets
        </Tabs.Tab>
        <Tabs.Tab
          value="pallets"
          leftSection={<IconBoxAlignBottomRight style={iconStyle} />}
          data-testid="tab-pallets"
        >
          Pallets
        </Tabs.Tab>

        <Tabs.Tab
          value="transfer-info"
          leftSection={<IconSend2 style={iconStyle} />}
          data-testid="tab-transfer-info"
        >
          Transfer Info
        </Tabs.Tab>

        <Tabs.Tab
          value="asset-claim"
          leftSection={<IconWallet style={iconStyle} />}
          data-testid="tab-asset-claim"
        >
          Asset Claim
        </Tabs.Tab>
        <Tabs.Tab
          value="eth-bridge"
          leftSection={<IconWallet style={iconStyle} />}
          data-testid="tab-eth-bridge"
        >
          ETH Bridge
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

        <Tabs.Panel value="transfer-info">
          <TransferInfo />
        </Tabs.Panel>

        <Tabs.Panel value="asset-claim">
          <AssetClaim />
        </Tabs.Panel>

        <Tabs.Panel value="eth-bridge">
          <EthBridgeTransfer />
        </Tabs.Panel>
      </Container>
    </Tabs>
  );
};

export default XcmSdkSandbox;
