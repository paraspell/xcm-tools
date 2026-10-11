import {
  ActionIcon,
  Anchor,
  Button,
  Group,
  Image,
  Menu,
  UnstyledButton,
} from "@mantine/core";
import {
  IconBrandGithub,
  IconChevronDown,
  IconMenu2,
  IconX,
} from "@tabler/icons-react";
import type { FC } from "react";
import { Link } from "react-router";

import classes from "./Header.module.css";
import { DOCS_URL, GITHUB_URL, links } from "./links";
import { ThemeToggle } from "./ThemeToggle";

type Props = {
  menuOpened: boolean;
  toggleMenu: () => void;
};

export const Header: FC<Props> = ({ menuOpened, toggleMenu }) => {
  const items = links.map((link) => {
    if (link.links) {
      return (
        <Menu
          key={link.label}
          trigger="hover"
          position="bottom-start"
          offset={10}
          transitionProps={{ exitDuration: 0 }}
          classNames={{ dropdown: classes.dropdown, item: classes.item }}
        >
          <Menu.Target>
            <UnstyledButton className={classes.link}>
              <Group gap="xxs" wrap="nowrap">
                {link.label}
                <IconChevronDown size={14} />
              </Group>
            </UnstyledButton>
          </Menu.Target>
          <Menu.Dropdown>
            {link.links.map((item) => (
              <Menu.Item component={Link} to={item.link} key={item.link}>
                {item.label}
              </Menu.Item>
            ))}
          </Menu.Dropdown>
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
    <Group
      h="100%"
      justify="space-between"
      wrap="nowrap"
      className={classes.inner}
    >
      <Link
        to="/"
        aria-label="ParaSpell home"
        className={classes.logo}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        <Image src="/paraspell-icon.png" alt="ParaSpell" h={38} w="auto" />
      </Link>

      <Group gap={2} visibleFrom="md" wrap="nowrap">
        {items}
        <Group gap="sm" ml="lg" wrap="nowrap">
          <ThemeToggle size={38} iconSize={18} />
          <Button
            component="a"
            href={GITHUB_URL}
            target="_blank"
            rel="noopener"
            variant="default"
            h={38}
            px="sm"
            radius="md-lg"
            leftSection={<IconBrandGithub size={16} />}
          >
            GitHub
          </Button>
          <Button
            component="a"
            href={DOCS_URL}
            target="_blank"
            rel="noopener"
            h={38}
            px="md"
            radius="md-lg"
          >
            Get started
          </Button>
        </Group>
      </Group>

      <Group gap="xs" hiddenFrom="md" wrap="nowrap">
        <ThemeToggle size="xl" iconSize={20} />
        <ActionIcon
          size="xl"
          onClick={toggleMenu}
          aria-label="Menu"
          className={classes.menuToggle}
        >
          {menuOpened ? <IconX size={22} /> : <IconMenu2 size={22} />}
        </ActionIcon>
      </Group>
    </Group>
  );
};
