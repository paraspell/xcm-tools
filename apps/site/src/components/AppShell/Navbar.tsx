import { Anchor, Button, Divider, Group, Stack, Text } from "@mantine/core";
import { IconBrandGithub } from "@tabler/icons-react";
import { Link } from "react-router";

import { DOCS_URL, GITHUB_URL, links } from "./links";
import classes from "./Navbar.module.css";

export const Navbar = () => {
  const items = links.map((link) => {
    if (link.links) {
      return (
        <Stack key={link.label} gap={2}>
          <Text variant="eyebrow" className={classes.label}>
            {link.label}
          </Text>
          {link.links.map((item) => (
            <Anchor
              component={Link}
              key={item.link}
              to={item.link}
              className={classes.link}
            >
              {item.label}
            </Anchor>
          ))}
          <Divider my="xs" mx="sm" color="var(--ps-line)" />
        </Stack>
      );
    }

    return (
      <Anchor
        component={Link}
        key={link.label}
        to={link.link}
        className={classes.link}
      >
        {link.label}
      </Anchor>
    );
  });

  return (
    <Stack gap={2}>
      {items}

      <Group gap="xs" pt="md" px="sm" grow>
        <Button
          component="a"
          href={GITHUB_URL}
          target="_blank"
          rel="noopener"
          variant="default"
          h={46}
          radius="md-lg"
          fz="sm"
          leftSection={<IconBrandGithub size={18} />}
        >
          GitHub
        </Button>
        <Button
          component="a"
          href={DOCS_URL}
          target="_blank"
          rel="noopener"
          h={46}
          radius="md-lg"
          fz="sm"
        >
          Get started
        </Button>
      </Group>
    </Stack>
  );
};
