import { Paper, SimpleGrid, Text, ThemeIcon, Title } from "@mantine/core";
import {
  IconCloudUpload,
  IconFileCode,
  IconReceiptOff,
} from "@tabler/icons-react";

import { Section } from "../Section/Section";
import classes from "./FeaturesIcons.module.css";

const data = [
  {
    icon: IconReceiptOff,
    title: "Free and open source",
    description:
      "All packages are published under MIT license, you can use ParaSpell in any project.",
  },
  {
    icon: IconFileCode,
    title: "TypeScript based",
    description:
      "Entirely built in TypeScript, ensuring distinct type safety for secure integration.",
  },
  {
    icon: IconCloudUpload,
    title: "Self-Deployment flexibility",
    description:
      "Offers flexibility for self-deployment, adapting to infrastructure needs.",
  },
];

export const FeaturesIcons = () => {
  const items = data.map((item) => (
    <Paper className={classes.item} key={item.title}>
      <ThemeIcon variant="light" size={56} radius="lg">
        <item.icon size={26} stroke={1.5} />
      </ThemeIcon>
      <Text className={classes.itemTitle}>{item.title}</Text>
      <Text className={classes.itemDescription}>{item.description}</Text>
    </Paper>
  ));

  return (
    <Section id="features">
      <Title className={classes.title} order={2}>
        ParaSpell is{" "}
        <Text span variant="script" className={classes.highlight}>
          not
        </Text>{" "}
        just another set of Tools
      </Title>

      <Text c="dimmed" className={classes.description}>
        Designed to enhance cross-chain interactions, ParaSpell equips
        developers with powerful tools to effortlessly integrate XCM.
      </Text>

      <SimpleGrid
        minColWidth="min(100%, 260px)"
        autoFlow="auto-fit"
        spacing="lg"
        mt={52}
      >
        {items}
      </SimpleGrid>
    </Section>
  );
};
