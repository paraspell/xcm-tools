import { Anchor, Button, Divider, Group, Stack } from "@mantine/core";
import { Link } from "react-router";

import { links } from "./links";
import classes from "./Navbar.module.css";

export const Navbar = () => {
  const items = links.map((link) => (
    <Anchor
      component={Link}
      key={link.label}
      to={link.link}
      className={classes.link}
    >
      {link.label}
    </Anchor>
  ));

  return (
    <>
      <Stack gap={5}>{items}</Stack>

      <Divider my="sm" />

      <Group justify="left" pb="xl" px="xs">
        <Button component={Link} to="/#try-it">
          Get started
        </Button>
      </Group>
    </>
  );
};
