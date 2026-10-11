import type { BoxProps } from "@mantine/core";
import {
  Box,
  Button,
  Flex,
  Group,
  List,
  Paper,
  SimpleGrid,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import type { Icon } from "@tabler/icons-react";
import { IconCheck } from "@tabler/icons-react";
import type { FC, ReactNode } from "react";

import { tiltHandlers } from "../Magic/magic";
import { Section } from "../Section/Section";
import classes from "./ToolSection.module.css";

type Bullet = {
  title: string;
  description: string;
};

type Action = {
  label: string;
  href: string;
  outline?: boolean;
  icon?: ReactNode;
};

type Feature = {
  icon: Icon;
  title: string;
  description: string;
};

type Props = {
  id: string;
  tool: "sdk" | "api" | "analyser" | "cli";
  tagline: string;
  title: string;
  description: string;
  bullets: Bullet[];
  actions: Action[];
  features: Feature[];
  demo: ReactNode;
  reverse?: boolean;
  spacing?: "md" | "lg";
};

const FeatureGrid: FC<Pick<Props, "tool" | "features"> & BoxProps> = ({
  tool,
  features,
  ...props
}) => (
  <SimpleGrid
    minColWidth="min(100%, 240px)"
    autoFlow="auto-fit"
    spacing="md"
    mt={40}
    {...props}
  >
    {features.map((feature) => (
      <Paper key={feature.title} className={classes.feature} mod={{ tool }}>
        <ThemeIcon size={46} className={classes.featureIcon}>
          <feature.icon size={22} stroke={1.5} />
        </ThemeIcon>
        <div>
          <Text className={classes.featureTitle}>{feature.title}</Text>
          <Text c="dimmed" className={classes.featureDescription}>
            {feature.description}
          </Text>
        </div>
      </Paper>
    ))}
  </SimpleGrid>
);

export const ToolSection: FC<Props> = ({
  id,
  tool,
  tagline,
  title,
  description,
  bullets,
  actions,
  features,
  demo,
  reverse = false,
  spacing = "lg",
}) => (
  <Section id={id} spacing={spacing}>
    <Flex
      wrap="wrap"
      align="center"
      direction={reverse ? "row-reverse" : "row"}
      rowGap={56}
      columnGap={72}
    >
      <Box className={classes.body}>
        <Text variant="script" className={classes.tagline}>
          {tagline}
        </Text>
        <Title order={2} className={classes.title}>
          {title}
        </Title>
        <Text variant="lead" className={classes.description}>
          {description}
        </Text>

        <List
          mt="xl"
          spacing="sm"
          className={classes.list}
          classNames={{ itemWrapper: classes.listItem }}
          icon={
            <ThemeIcon size={20} radius="xl" mt={1}>
              <IconCheck size={12} stroke={2} />
            </ThemeIcon>
          }
        >
          {bullets.map((bullet) => (
            <List.Item key={bullet.title}>
              <b>{bullet.title}:</b> {bullet.description}
            </List.Item>
          ))}
        </List>

        <Group gap="sm" mt="xl">
          {actions.map((action) => (
            <Button
              key={action.label}
              component="a"
              href={action.href}
              target="_blank"
              rel="noopener"
              variant={action.outline ? "outline" : "filled"}
              size="lg"
              fz="md"
              leftSection={action.icon}
              className={classes.action}
            >
              {action.label}
            </Button>
          ))}
        </Group>

        <FeatureGrid tool={tool} features={features} hiddenFrom="sm" />
      </Box>

      <Box className={classes.demo}>
        <Paper className={classes.panel} mod={{ tool }} {...tiltHandlers}>
          {demo}
        </Paper>
      </Box>
    </Flex>

    <FeatureGrid tool={tool} features={features} visibleFrom="sm" />
  </Section>
);
