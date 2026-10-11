import { Group, Paper, SimpleGrid, Text, Title } from "@mantine/core";
import { IconArrowDown } from "@tabler/icons-react";
import { Link } from "react-router";

import { tiltHandlers } from "../Magic/magic";
import classes from "./HeroCards.module.css";

const cards = [
  {
    tool: "api",
    link: "/#xcm-api",
    title: "XCM API ⚡️",
    description: "Integrate XCM via a powerful, package-less API.",
  },
  {
    tool: "sdk",
    link: "/#xcm-sdk",
    title: "XCM SDK 🪄",
    description: "Simplify cross-chain development with our easy-to-use SDK.",
  },
  {
    tool: "analyser",
    link: "/#xcm-analyser",
    title: "XCM Analyser 🔎",
    description: "Convert XCM Locations into human-readable format.",
  },
];

export const HeroCards = () => (
  <SimpleGrid
    type="container"
    minColWidth="min(100%, 250px)"
    autoFlow="auto-fit"
    spacing="xl"
    mt={64}
    ta="left"
    className={classes.grid}
  >
    {cards.map((card) => (
      <Paper
        key={card.tool}
        component={Link}
        to={card.link}
        mod={{ tool: card.tool }}
        className={classes.card}
        {...tiltHandlers}
      >
        <Title order={3} className={classes.title}>
          {card.title}
        </Title>
        <Text className={classes.description}>{card.description}</Text>
        <Group gap="xxs" mt="lg" className={classes.explore}>
          Explore
          <IconArrowDown size={16} />
        </Group>
      </Paper>
    ))}
  </SimpleGrid>
);
