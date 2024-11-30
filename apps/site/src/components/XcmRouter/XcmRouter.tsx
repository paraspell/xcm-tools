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
import classes from "./XcmRouter.module.css";
import {
  IconExchange,
  IconNetwork,
  IconRocket,
  IconCheck,
} from "@tabler/icons-react";
import { useMediaQuery } from "@mantine/hooks";

const data = [
  {
    icon: IconExchange,
    title: "Seamless Exchanges",
    description:
      "Send one token type and receive a different one on the destination chain with ease.",
  },
  {
    icon: IconNetwork,
    title: "Extensive DEX Integration",
    description:
      "Implements 8 major Parachain DEXes with access to 524 asset pools.",
  },
  {
    icon: IconRocket,
    title: "Simplified Development",
    description:
      "Achieve cross-chain swaps with a single call and three signatures, improving the user experience.",
  },
];

const XcmRouter = () => {
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
    <div className={classes.wrapper} id="xcm-router">
      <div className={classes.body}>
        <Title className={classes.title}>SpellRouter ☄️</Title>
        <Text c="dimmed" maw={550}>
          Experience seamless cross-chain asset exchanges across the Polkadot
          and Kusama ecosystems. Send one token type and receive another on the
          destination chain, all within a single, simplified process.
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
            <b>Largest Liquidity Bridging Tool</b> – Access 524 asset pools,
            making XCM Router the most extensive liquidity bridging solution in
            the ecosystem.
          </List.Item>
          <List.Item>
            <b>User-Friendly Experience</b> – Simplifies cross-chain
            interactions to minimize user errors and enhance the overall
            experience.
          </List.Item>
        </List>

        <div className={classes.controls}>
          <Button
            component="a"
            href="https://paraspell.github.io/docs/router/getting-strtd.html"
            target="_blank"
            size="lg"
            radius="lg"
            mt="xl"
            mr="md"
          >
            Read more
          </Button>
          <Button
            variant="outline"
            component="a"
            href="https://github.com/paraspell/xcm-router-template"
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

export default XcmRouter;
