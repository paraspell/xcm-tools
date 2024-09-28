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
import classes from "./XcmApi.module.css";
import {
  IconApi,
  IconBrandNodejs,
  IconCheck,
  IconPackageOff,
} from "@tabler/icons-react";
import { useMediaQuery } from "@mantine/hooks";

const data = [
  {
    icon: IconPackageOff,
    title: "Package-less integration",
    description:
      "Integrates easily without the need for packages, allowing for easy deployment and use.",
  },
  {
    icon: IconApi,
    title: "REST API Standards",
    description:
      "Follows REST API standards, ensuring easy integration with existing systems.",
  },
  {
    icon: IconBrandNodejs,
    title: "Built on NestJS",
    description:
      "Leverages the scalable NestJS framework, ensuring a maintainable backend architecture.",
  },
];

const XcmApi = () => {
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
    <div className={classes.wrapper} id="xcm-api">
      <div className={classes.body}>
        <Title className={classes.title}>XCM API - LightSpell ⚡️</Title>
        <Text c="dimmed" maw={550}>
          Accelerate your cross-chain interactions with a powerful,
          developer-friendly API designed for seamless asset transfers between
          the Polkadot and Kusama ecosystems.
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
            <b>Full ParaSpell Feature Support</b> – The API supports all core
            functions available in other ParaSpell packages, providing a
            complete solution for cross-chain interactions.
          </List.Item>
          <List.Item>
            <b>Rate Limiting for Stability</b> – Built-in rate limiting ensures
            consistent performance, preventing abuse and maintaining stability
            across all API interactions.
          </List.Item>
        </List>

        <div className={classes.controls}>
          <Button
            component="a"
            href="https://lightspell.xyz/"
            target="_blank"
            size="lg"
            radius="lg"
            mt="xl"
          >
            Read more
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

export default XcmApi;
