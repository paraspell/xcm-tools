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
import { IconArrowsExchange, IconCheck, IconPuzzle } from "@tabler/icons-react";

import classes from "./XcmAnalyser.module.css";

const data = [
  {
    icon: IconArrowsExchange,
    title: "Easy Location Conversion",
    description: "Effortlessly convert XCM Location into human-readable URLs.",
  },
  {
    icon: IconPuzzle,
    title: "Supports Various Junction Types",
    description:
      "Compatible with a wide range of junction types for comprehensive coverage.",
  },
];

export const XcmAnalyser = () => {
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
    <div className={classes.wrapper} id="xcm-analyser">
      <div className={classes.body}>
        <Title className={classes.title}>XCM Analyser 🔎</Title>
        <Text c="dimmed" maw={550}>
          Simplify your development process with an advanced tool that
          translates XCM Locations into human-readable URLs, making cross-chain
          interactions easier to access and understand.
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
            <b>Comprehensive Junction Type Support</b> – Supports multiple
            junction types like Parachain, AccountId32, PalletInstance, and more
            for complete coverage.
          </List.Item>
        </List>

        <div className={classes.controls}>
          <Button
            component="a"
            href="https://paraspell.github.io/docs/analyser/getng-strtd.html"
            target="_blank"
            size="lg"
            radius="lg"
            mt="xl"
          >
            Start analysing
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
