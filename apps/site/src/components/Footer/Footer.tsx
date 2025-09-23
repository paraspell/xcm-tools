import {
  ActionIcon,
  Anchor,
  Button,
  Container,
  Group,
  Image,
  Menu,
  rem,
  Text,
} from "@mantine/core";
import { IconBrandGithub, IconChevronDown } from "@tabler/icons-react";
import { Link } from "react-router-dom";

import { links } from "../AppShell/links";
import classes from "./Footer.module.css";

const data = [
  {
    links: [
      ...links,
      {
        label: "Code of Conduct",
        link: "https://www.netlify.com/code-of-conduct/",
      },
    ],
  },
];

export const Footer = () => {
  const groups = data.map((group, indexGroup) => {
    const links = group.links.map((link, index) => {
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
                <Group align="center" gap={4}>
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
        <Link key={index + indexGroup} className={classes.link} to={link.link}>
          {link.label}
        </Link>
      );
    });

    return (
      <div key={indexGroup} className={classes.wrapper}>
        {links}
      </div>
    );
  });

  return (
    <footer className={classes.footer}>
      <Container className={classes.inner}>
        <div className={classes.logo}>
          <Image src="logo.png" p={8} />
          <Text size="xs" c="dimmed" className={classes.description}>
            A XCM Tool set designed to unify the cross-chain experience on
            Polkadot.
          </Text>
        </div>
        <div className={classes.groups}>
          {groups}
          <div className={classes.wrapper}>
            <Text className={classes.title}>
              Are you interested in ParaSpell✨ ?
            </Text>
            <Button
              component="a"
              target="_blank"
              href="https://paraspell.github.io/docs/"
              size="md"
              radius="lg"
              w="100%"
            >
              Get started
            </Button>
          </div>
        </div>
      </Container>
      <Container className={classes.afterFooter}>
        <Text c="dimmed" size="sm">
          © 2025 paraspell.xyz · Powered by{" "}
          <Anchor
            href="https://www.netlify.com"
            target="_blank"
            size="sm"
            c="dimmed"
          >
            Netlify
          </Anchor>
        </Text>

        <Group
          gap={0}
          className={classes.social}
          justify="flex-end"
          wrap="nowrap"
        >
          <ActionIcon
            component="a"
            href="https://github.com/paraspell/xcm-tools/"
            target="_blank"
            size="lg"
            color="gray"
            variant="subtle"
          >
            <IconBrandGithub
              style={{ width: rem(18), height: rem(18) }}
              stroke={1.5}
            />
          </ActionIcon>
        </Group>
      </Container>
    </footer>
  );
};

export default Footer;
