import {
  Text,
  Title,
  Button,
  ThemeIcon,
  rem,
  SimpleGrid,
  List,
  Box,
} from "@mantine/core";
import classes from "./XcmSdk.module.css";
import {
  IconBoxAlignBottomRight,
  IconBuildingBridge2,
  IconCheck,
  IconCoins,
  IconSend,
} from "@tabler/icons-react";
import { useMediaQuery } from "@mantine/hooks";

const data = [
  {
    icon: IconSend,
    title: "XCM transfer",
    description: "Experiment with XCM to securely transfer assets",
  },
  {
    icon: IconCoins,
    title: "Assets",
    description: "Explore retrieving various details about assets",
  },
  {
    icon: IconBoxAlignBottomRight,
    title: "Pallets",
    description: "Query the XCM pallets that parachains currently support",
  },
  {
    icon: IconBuildingBridge2,
    title: "Polkadot bridges",
    description: "Transfer assets between ecosystems with ease",
  },
];

const XcmSdk = () => {
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
          efficient cross-chain dapps within the Polkadot and Kusama ecosystems.
          Experiment with XCM transfers, asset queries, and cross-chain bridges
          with no setup required.
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
            <b>Multi-chain compatibility</b> – Seamlessly interact with more
            than 60+ parachains and relay chains across the Polkadot and Kusama
            ecosystems.
          </List.Item>
          <List.Item>
            <b>Extensive asset support</b> – Manage both native and foreign
            assets with flexible customization of multilocations and XCM calls.
          </List.Item>
          <List.Item>
            <b>Customizable XCM Versions</b> – Tailor your transactions by
            selecting the appropriate XCM version for your cross-chain
            interactions.
          </List.Item>
        </List>

        <div className={classes.controls}>
          <Button
            component="a"
            href="https://paraspell.github.io/docs/sdk/getting-started.html"
            target="_blank"
            size="lg"
            radius="lg"
            mt="xl"
          >
            Start building with XCM SDK
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

export default XcmSdk;
