import {
  ActionIcon,
  Anchor,
  Box,
  Button,
  Container,
  Flex,
  Group,
  Image,
  Stack,
  Text,
} from "@mantine/core";
import { Link } from "react-router";

import { DOCS_URL, links, socials } from "../AppShell/links";
import classes from "./Footer.module.css";

const explore = [
  { label: "Research", link: "/#research" },
  { label: "Contact us", link: "/#contact-us" },
];

export const Footer = () => {
  const toolLinks = links.flatMap((link) => link.links ?? []);

  return (
    <footer className={classes.footer}>
      <Container size="content" p={0}>
        <Flex wrap="wrap" justify="space-between" gap={40}>
          <div className={classes.brand}>
            <Image src="/logo.png" alt="ParaSpell" w={190} />
            <Text className={classes.description}>
              A XCM Tool set designed to unify the cross-chain experience on
              Polkadot.
            </Text>
          </div>

          <Flex wrap="wrap" rowGap={40} columnGap={64}>
            <Stack gap="xs" miw={150}>
              <Text variant="eyebrow" className={classes.groupTitle}>
                XCM Tools
              </Text>
              {toolLinks.map((link) => (
                <Anchor
                  key={link.link}
                  component={Link}
                  to={link.link}
                  className={classes.link}
                >
                  {link.label}
                </Anchor>
              ))}
            </Stack>

            <Stack gap="xs" miw={150}>
              <Text variant="eyebrow" className={classes.groupTitle}>
                Explore
              </Text>
              <Anchor
                href="https://status.paraspell.xyz/"
                target="_blank"
                rel="noopener"
                className={classes.link}
              >
                <Group gap="xs" wrap="nowrap">
                  <span className={classes.status} />
                  Status page
                </Group>
              </Anchor>
              {explore.map((link) => (
                <Anchor
                  key={link.link}
                  component={Link}
                  to={link.link}
                  className={classes.link}
                >
                  {link.label}
                </Anchor>
              ))}
              <Anchor
                href="https://www.netlify.com/code-of-conduct/"
                target="_blank"
                rel="noopener"
                className={classes.link}
              >
                Code of Conduct
              </Anchor>
            </Stack>

            <Box w={260} maw="100%">
              <Text className={classes.ctaTitle}>
                Are you interested in{" "}
                <span className={classes.nowrap}>ParaSpell✨?</span>
              </Text>
              <Button
                component="a"
                target="_blank"
                rel="noopener"
                href={DOCS_URL}
                fullWidth
                h={46}
                radius="md-lg"
                fz="sm"
                fw={700}
              >
                Get started
              </Button>
            </Box>
          </Flex>
        </Flex>

        <Flex
          wrap="wrap"
          align="center"
          justify="space-between"
          gap="md"
          className={classes.afterFooter}
        >
          <Text className={classes.copyright}>
            © 2026 paraspell.xyz · Powered by{" "}
            <Anchor
              href="https://www.netlify.com"
              target="_blank"
              rel="noopener"
              className={classes.netlify}
            >
              Netlify
            </Anchor>
          </Text>

          <Group gap="xxs">
            {socials.map((social) => (
              <ActionIcon
                key={social.label}
                component="a"
                href={social.link}
                target="_blank"
                rel="noopener"
                aria-label={social.label}
                variant="subtle"
                size={38}
                radius="md"
                className={classes.social}
              >
                <social.icon size={19} />
              </ActionIcon>
            ))}
          </Group>
        </Flex>
      </Container>
    </footer>
  );
};
