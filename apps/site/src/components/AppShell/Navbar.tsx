import { Anchor, Button, Divider, Group, Menu, Stack } from "@mantine/core";
import { links } from "./links";
import { Link } from "react-router-dom";
import classes from "./Navbar.module.css";
import { IconChevronDown } from "@tabler/icons-react";
import { GithubIcon } from "@mantinex/dev-icons";

const Navbar = () => {
  const items = links.map((link) => {
    const menuItems = link.links?.map((item) => (
      <Menu.Item component={Link} to={item.link} key={item.link}>
        {item.label}
      </Menu.Item>
    ));

    if (menuItems) {
      return (
        <Menu
          key={link.label}
          trigger="hover"
          transitionProps={{ exitDuration: 0 }}
          withinPortal
          position="bottom-start"
        >
          <Menu.Target>
            <Anchor
              href={link.link}
              className={classes.link}
              onClick={(event) => event.preventDefault()}
            >
              <Group gap={4}>
                <span className={classes.linkLabel}>{link.label}</span>
                <IconChevronDown size="0.9rem" stroke={1.5} />
              </Group>
            </Anchor>
          </Menu.Target>
          <Menu.Dropdown>{menuItems}</Menu.Dropdown>
        </Menu>
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
    <>
      <Stack gap={5}>{items}</Stack>

      <Divider my="sm" />

      <Group justify="left" pb="xl" px="xs">
        <Button
          radius="lg"
          component="a"
          href="https://paraspell.github.io/docs/api/g-started.html"
          target="_blank"
        >
          Get started
        </Button>
        <Button
          component="a"
          href="https://github.com/paraspell/xcm-tools/"
          target="_blank"
          size="sm"
          variant="default"
          leftSection={<GithubIcon size={16} />}
          radius="lg"
        >
          GitHub
        </Button>
      </Group>
    </>
  );
};

export default Navbar;
