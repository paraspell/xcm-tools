import { Text, Container, ThemeIcon, Title, SimpleGrid } from "@mantine/core";
import classes from "./FeaturesIcons.module.css";
import {
  IconCloudUpload,
  IconFileCode,
  IconReceiptOff,
} from "@tabler/icons-react";

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
      "Offers flexibility for self-deployment, adapting  to infrastructure needs.",
  },
];

export function FeaturesIcons() {
  const items = data.map((item) => (
    <div className={classes.item} key={item.title}>
      <ThemeIcon
        variant="light"
        className={classes.itemIcon}
        size={60}
        radius="lg"
      >
        <item.icon />
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
    <Container size="xl" className={classes.wrapper} id="features">
      <Text className={classes.supTitle}>Features</Text>

      <Title className={classes.title} order={2} fw={700}>
        ParaSpell is <span className={classes.highlight}>not</span> just another
        SDK
      </Title>

      <Container size={660} p={0}>
        <Text c="dimmed" className={classes.description}>
          Designed to enhance cross-chain interactions, ParaSpell equips
          developers with powerful tools to effortlessly integrate XCM.
        </Text>
      </Container>

      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing={50} mt={30}>
        {items}
      </SimpleGrid>
    </Container>
  );
}
