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
  IconCheck,
  IconComponents,
  IconPlugConnected,
  IconTerminal2,
} from "@tabler/icons-react";

import classes from "../XcmApi/XcmApi.module.css";

const data = [
  {
    icon: IconTerminal2,
    title: "Interactive Scaffolding",
    description:
      "Answer a few guided prompts and generate a fully configured starter project in seconds.",
  },
  {
    icon: IconComponents,
    title: "Multi-Framework Support",
    description:
      "Generate projects for React, Vue, or Node.js with your preferred blockchain client.",
  },
  {
    icon: IconPlugConnected,
    title: "Optional Extensions",
    description:
      "Extend your project with EVM, Swap, and Snowbridge support right from setup.",
  },
];

export const XcmCli = () => {
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
    <div className={classes.wrapper} id="xcm-cli">
      <div className={classes.body}>
        <Title className={classes.title}>ParaSpell CLI 🧰</Title>
        <Text c="dimmed" maw={550}>
          Spin up production-ready cross-chain dApps in seconds. Our scaffolding
          CLI generates a fully configured XCM SDK or XCM API starter project
          for the Polkadot, Kusama, Paseo and Westend ecosystems, with no manual
          setup required.
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
            <b>Choice of blockchain client</b> – Pick PAPI, Polkadot.js, or
            Dedot as the underlying client powering your project.
          </List.Item>
          <List.Item>
            <b>Automation friendly</b> – Skip prompts with flags and
            non-interactive defaults, perfect for CI/CD pipelines.
          </List.Item>
        </List>

        <div className={classes.controls}>
          <Button
            component="a"
            href="https://paraspell.github.io/docs/paraspell-cli/getting-started.html"
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
            href="https://github.com/paraspell/cli"
            target="_blank"
            size="lg"
            radius="lg"
            mt="xl"
          >
            GitHub
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
          mr={100}
          cols={{ base: 1, xs: 1 }}
          spacing={isSmallScreen ? 36 : 50}
        >
          {items}
        </SimpleGrid>
      </Box>
    </div>
  );
};
