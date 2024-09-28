import { FC } from "react";
import {
  Container,
  Group,
  Burger,
  Image,
  Button,
  Anchor,
  Menu,
} from "@mantine/core";
import classes from "./Header.module.css";
import { Link } from "react-router-dom";
import { links } from "./links";
import { GithubIcon } from "@mantinex/dev-icons";
import { IconChevronDown } from "@tabler/icons-react";

type Props = {
  menuOpened: boolean;
  toggleMenu: () => void;
  pinned: boolean;
};

const Header: FC<Props> = ({ menuOpened, toggleMenu, pinned }) => {
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
    <Container
      fluid
      className={classes.inner}
      px={48}
      style={{
        boxShadow: pinned
          ? "none"
          : "0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)",
        transition: "box-shadow 100ms ease",
      }}
    >
      <Link to="/" style={{ display: "flex", width: "auto" }}>
        <Image src="paraspell-icon.png" py="md" fit="contain" h={70} />
      </Link>
      <Group gap={5} visibleFrom="md">
        {items}
        <Group gap="md" ml="xl">
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
          <Button
            component="a"
            href="https://paraspell.github.io/docs/"
            target="_blank"
            radius="lg"
            px="lg"
            size="sm"
          >
            Get started
          </Button>
        </Group>
      </Group>

      <Burger
        opened={menuOpened}
        onClick={toggleMenu}
        hiddenFrom="md"
        size="sm"
      />
    </Container>
  );
};

export default Header;
