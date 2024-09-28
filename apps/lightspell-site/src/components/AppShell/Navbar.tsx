import { Anchor, Button, Divider, Group, Stack } from "@mantine/core";
import { links } from "./links";
import { Link } from "react-router-dom";
import classes from "./Navbar.module.css";

const Navbar = () => {
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

export default Navbar;
