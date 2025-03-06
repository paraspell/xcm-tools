import { Button, rem, SimpleGrid, Text, ThemeIcon, Title } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import {
  IconBoxAlignBottomRight,
  IconBuildingBridge2,
  IconCoins,
  IconSend,
} from "@tabler/icons-react";

import classes from "./TryIt.module.css";

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

export function Tryit() {
  const isSmallScreen = useMediaQuery("(max-width: 768px)");

  const items = data.map((item) => (
    <div className={classes.item} key={item.title}>
      <ThemeIcon
        variant="light"
        className={classes.itemIcon}
        size={60}
        radius="md"
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
    <div className={classes.wrapper} id="try-it">
      <div className={classes.body}>
        <Title className={classes.title}>
          Explore XCM API in the Playground
        </Title>
        <Text c="dimmed" maw={550}>
          Get hands-on with our API instantly in our interactive playground. No
          setup needed—just experiment, see real-time results, and gauge the
          API&apos;s fit for your projects. Ready to explore its full potential
          effortlessly?
        </Text>

        <div className={classes.controls}>
          <Button
            component="a"
            href="https://playground.paraspell.xyz/xcm-sdk-sandbox"
            target="_blank"
            size="lg"
            radius="md"
            mt="xl"
          >
            Try it now
          </Button>
        </div>
      </div>
      <div style={{ flex: 0.7 }}>
        <SimpleGrid cols={{ base: 1, xs: 2 }} spacing={isSmallScreen ? 36 : 50}>
          {items}
        </SimpleGrid>
      </div>
    </div>
  );
}
