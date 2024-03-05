import {
  Title,
  SimpleGrid,
  Text,
  Button,
  ThemeIcon,
  Grid,
  rem,
} from "@mantine/core";
import {
  IconReceiptOff,
  IconFileCode,
  IconPackageOff,
  IconCloudUpload,
} from "@tabler/icons-react";
import classes from "./Features.module.css";
import { useMediaQuery } from "@mantine/hooks";

const features = [
  {
    icon: IconReceiptOff,
    title: "Free and open source",
    description:
      "All packages are published under MIT license, you can use LightSpell in any project",
  },
  {
    icon: IconFileCode,
    title: "TypeScript based",
    description:
      "Entirely built in TypeScript, ensuring distinct type safety for secure integration",
  },
  {
    icon: IconPackageOff,
    title: "Package-less integration",
    description:
      "Integrates easily without the need for packages, allowing for easy deployment and use",
  },
  {
    icon: IconCloudUpload,
    title: "Self-Deployment flexibility",
    description:
      "Offers flexibility for self-deployment, adapting effortlessly to your infrastructure needs",
  },
];

export function Features() {
  const isSmallScreen = useMediaQuery("(max-width: 768px)");

  const items = features.map((feature) => (
    <div key={feature.title}>
      <ThemeIcon size={44} radius="md">
        <feature.icon
          style={{ width: rem(26), height: rem(26) }}
          stroke={1.5}
        />
      </ThemeIcon>
      <Text fz="lg" mt="sm" fw={500}>
        {feature.title}
      </Text>
      <Text c="dimmed" fz="sm">
        {feature.description}
      </Text>
    </div>
  ));

  return (
    <div className={classes.wrapper} id="features">
      <Grid gutter={isSmallScreen ? 60 : 80}>
        <Grid.Col span={{ base: 12, md: 5 }}>
          <Title className={classes.title} order={2}>
            Simplify Your DApp Development with LightSpell⚡️
          </Title>
          <Text c="dimmed">
            LightSpell offers an extensive array of APIs, specifically designed
            to enhance the cross-chain experience.
          </Text>

          <Button
            component="a"
            href="https://paraspell.github.io/docs/api/g-started.html"
            size="lg"
            radius="md"
            mt="xl"
          >
            View docs
          </Button>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 7 }}>
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing={30}>
            {items}
          </SimpleGrid>
        </Grid.Col>
      </Grid>
    </div>
  );
}
