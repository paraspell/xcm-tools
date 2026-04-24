import {
  Box,
  Button,
  List,
  rem,
  SimpleGrid,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import {
  IconBoxAlignBottomRight,
  IconCheck,
  IconCoins,
  IconExchange,
  IconSend,
} from "@tabler/icons-react";

import classes from "./XcmSdk.module.css";

const data = [
  {
    icon: IconSend,
    title: "XCM Transfer",
    description: "Experiment with XCM to securely transfer assets",
  },
  {
    icon: IconExchange,
    title: "Swap",
    description: "Perform one or two click cross-chain swaps with ease",
  },
  {
    icon: IconBoxAlignBottomRight,
    title: "Transact",
    description:
      "Execute cross-chain calls that trigger execution on destination chain",
  },
  {
    icon: IconCoins,
    title: "Assets",
    description: "Explore retrieving various details about assets",
  },
];

export const XcmSdk = () => {
  const isSmallScreen = useMediaQuery("(max-width: 768px)");

  const items = data.map((item) => (
    <div className={classes.item} key={item.title}>
      <ThemeIcon
        variant="light"
        className={classes.itemIcon}
        size={60}
        radius="lg"
      >
        <item.icon style={{ width: rem(26), height: rem(26) }} stroke={1.5} />
      </ThemeIcon>

      <div>
        <Text fw={700} fz="lg" className={classes.itemTitle}>
          {item.title}
        </Text>
        <Text c="dimmed">{item.description}</Text>
      </div>
    </div>
  ));

  return (
    <div className={classes.wrapper} id="xcm-sdk">
      <div className={classes.body}>
        <Title className={classes.title}>XCM SDK 🪄</Title>
        <Text c="dimmed" maw={550}>
          Explore our XCM SDK — a complete toolkit for building secure and
          efficient cross-chain dapps within the Polkadot, Kusama, Paseo and
          Westend ecosystems. Experiment with XCM transfers, transact calls,
          swap calls, asset queries, and cross-chain bridges with no setup
          required.
        </Text>

        <SimpleGrid
          my="xl"
          hiddenFrom="sm"
          cols={{ base: 1, xs: 1 }}
          spacing={isSmallScreen ? 36 : 50}
        >
          {items}
        </SimpleGrid>

        <List
          mt={30}
          spacing="sm"
          size="sm"
          icon={
            <ThemeIcon size={20} radius="xl">
              <IconCheck
                style={{ width: rem(12), height: rem(12) }}
                stroke={1.5}
              />
            </ThemeIcon>
          }
        >
          <List.Item>
            <b>Multi-chain compatibility</b> - Seamlessly interact with every
            XCM compatible Parachain or Relay chain across the Polkadot, Kusama,
            Paseo and Westend ecosystems.
          </List.Item>
          <List.Item>
            <b>Extensive asset support</b> - Manage both native and foreign
            assets with flexible customization of XCM locations and XCM calls.
          </List.Item>
          <List.Item>
            <b>Customizable XCM Versions</b> - Tailor your transactions by
            selecting the appropriate XCM version for your cross-chain
            interactions.
          </List.Item>
        </List>

        <div className={classes.controls}>
          <Button
            component="a"
            href="https://paraspell.github.io/docs/xcm-sdk/getting-started.html"
            target="_blank"
            size="lg"
            radius="lg"
            mt="xl"
            mr="md"
          >
            Get started
          </Button>
          <Button
            variant="outline"
            component="a"
            href="https://github.com/paraspell/xcm-sdk-template"
            target="_blank"
            size="lg"
            radius="lg"
            mt="xl"
          >
            Template project
          </Button>
        </div>
      </div>
      <Box
        visibleFrom="sm"
        style={{
          flex: 0.8,
        }}
      >
        <SimpleGrid
          ml={100}
          cols={{ base: 1, xs: 1 }}
          spacing={isSmallScreen ? 36 : 50}
        >
          {items}
        </SimpleGrid>
      </Box>
    </div>
  );
};
