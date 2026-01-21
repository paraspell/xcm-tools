import {
  ActionIcon,
  Anchor,
  Button,
  Container,
  Group,
  Image,
  rem,
  Text,
} from "@mantine/core";
import { IconBrandGithub } from "@tabler/icons-react";
import { Link } from "react-router";

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
    const links = group.links.map((link, index) => (
      <Link key={index + indexGroup} className={classes.link} to={link.link}>
        {link.label}
      </Link>
    ));

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
            API utilizing XCM-SDK to get you blazing fast ⚡️ XCM calls.
          </Text>
        </div>
        <div className={classes.groups}>
          {groups}
          <div className={classes.wrapper}>
            <Text className={classes.title}>
              Are you interested in LightSpell⚡️ ?
            </Text>
            <Button component={Link} to="/#features" size="md" w="100%">
              Get started
            </Button>
          </div>
        </div>
      </Container>
      <Container className={classes.afterFooter}>
        <Text c="dimmed" size="sm">
          © 2026 lightspell.xyz · Powered by{" "}
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
            href="https://github.com/paraspell/xcm-tools/tree/main/apps/xcm-api"
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
