import { CodeHighlight } from "@mantine/code-highlight";
import { Box, Tabs, Text } from "@mantine/core";
import {
  IconActivity,
  IconBoxAlignBottomRight,
  IconBuildingBridge2,
  IconCoins,
  IconExchange,
  IconReceipt2,
  IconSend,
} from "@tabler/icons-react";

import { CopyLabelButton } from "../CopyLabelButton/CopyLabelButton";
import { ToolSection } from "../ToolSection/ToolSection";
import classes from "./XcmSdk.module.css";

const examples = [
  {
    icon: IconSend,
    value: "transfer",
    title: "XCM Transfer",
    description: "Experiment with XCM to securely transfer assets",
    code: `const builder = Builder()
  .from('AssetHubPolkadot')
  .to('Polkadot')
  .currency({ symbol: 'DOT', amount: '1' })
  .recipient(address)

const tx = await builder.build()`,
  },
  {
    icon: IconExchange,
    value: "swap",
    title: "Swap",
    description: "Perform one or two click cross-chain swaps with ease",
    code: `import '@paraspell/swap'

const builder = Builder()
  .from('Polkadot')
  .to('Astar')
  .currency({ symbol: 'DOT', amount: '10' })
  .recipient(address)
  .sender(address)
  .swap({ currencyTo: { symbol: 'ASTR' } })

const txs = await builder.buildAll()`,
  },
  {
    icon: IconBoxAlignBottomRight,
    value: "transact",
    title: "Transact",
    description:
      "Execute cross-chain calls that trigger execution on destination chain",
    code: `const builder = Builder()
  .from('AssetHubPolkadot')
  .to('Hydration')
  .currency({ symbol: 'DOT', amount: '1' })
  .sender(address)
  .recipient(address)
  .transact(callHex)

const tx = await builder.build()`,
  },
  {
    icon: IconCoins,
    value: "assets",
    title: "Assets",
    description: "Explore retrieving various details about assets",
    code: `import {
  getParaId,
  getRelayChainSymbol,
  getSupportedDestinations
} from '@paraspell/sdk'

getParaId('Hydration')           // 2034
getRelayChainSymbol('Acala')     // 'DOT'
getSupportedDestinations(
  'AssetHubPolkadot', { symbol: 'USDT' }
)`,
  },
];

const features = [
  {
    icon: IconReceipt2,
    title: "XCM fee queries",
    description:
      "Know origin and destination XCM fees before sending, in any supported fee asset.",
  },
  {
    icon: IconBuildingBridge2,
    title: "Ecosystem bridges",
    description:
      "Bridge assets between Polkadot ↔ Kusama and Polkadot ↔ Ethereum via Snowbridge.",
  },
  {
    icon: IconActivity,
    title: "Transfer insights",
    description:
      "Dry run any transfer before sending and check transferable, minimal and receivable amounts.",
  },
];

const SdkDemo = () => (
  <Tabs
    defaultValue={examples[0].value}
    variant="pills"
    classNames={{ list: classes.tabs, tab: classes.tab }}
  >
    <Tabs.List>
      {examples.map((example) => (
        <Tabs.Tab
          key={example.value}
          value={example.value}
          leftSection={<example.icon size={18} />}
        >
          {example.title}
        </Tabs.Tab>
      ))}
    </Tabs.List>

    {examples.map((example) => (
      <Tabs.Panel key={example.value} value={example.value}>
        <Text className={classes.tabDescription}>{example.description}</Text>
        <Box pos="relative">
          <CopyLabelButton
            value={example.code}
            variant="default"
            h={28}
            px="xs"
            radius="md"
            className={classes.copy}
          />
          <CodeHighlight
            code={example.code}
            language="ts"
            withCopyButton={false}
            background="var(--mantine-color-body)"
            radius="lg"
            classNames={{ codeHighlight: classes.code, code: classes.codeBody }}
          />
        </Box>
      </Tabs.Panel>
    ))}
  </Tabs>
);

export const XcmSdk = () => (
  <ToolSection
    id="xcm-sdk"
    tool="sdk"
    spacing="md"
    tagline="it just works"
    title="XCM SDK 🪄"
    description="Explore our XCM SDK, a complete toolkit for building secure and efficient cross-chain dapps within the Polkadot, Kusama, Paseo and Westend ecosystems. Experiment with XCM transfers, transact calls, swap calls, asset queries, and cross-chain bridges with no setup required."
    bullets={[
      {
        title: "Multi-chain compatibility",
        description:
          "Seamlessly interact with every XCM compatible Parachain or Relay chain across the Polkadot, Kusama, Paseo and Westend ecosystems.",
      },
      {
        title: "Extensive asset support",
        description:
          "Manage both native and foreign assets with flexible customization of XCM locations and XCM calls.",
      },
      {
        title: "Customizable fee assets",
        description:
          "Pay XCM fees in an asset of your choice instead of the native one, for example when sending from AssetHub.",
      },
    ]}
    actions={[
      {
        label: "Get started",
        href: "https://paraspell.github.io/docs/xcm-sdk/getting-started.html",
      },
      {
        label: "Starter project",
        href: "https://paraspell.github.io/docs/paraspell-cli/getting-started.html",
        outline: true,
      },
    ]}
    features={features}
    demo={<SdkDemo />}
  />
);
