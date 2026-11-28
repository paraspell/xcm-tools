import { Anchor, Button, Group, Image, Text } from '@mantine/core';
import {
  DOCS_LINKS,
  paraspellIcon,
  SITE_URL,
  ThemeToggle,
} from '@paraspell/ui';
import { IconArrowUpRight } from '@tabler/icons-react';

import classes from './Header.module.css';

export const Header = () => {
  return (
    <Group
      component="header"
      h={70}
      px={{ base: 'md', sm: 48 }}
      justify="space-between"
      wrap="nowrap"
      className={classes.header}
    >
      <Group gap={14} wrap="nowrap">
        <Anchor
          href={SITE_URL}
          target="_blank"
          rel="noopener"
          aria-label="ParaSpell home"
          display="flex"
        >
          <Image src={paraspellIcon} alt="ParaSpell" h={38} w="auto" />
        </Anchor>
        <span className={classes.host}>
          <span className={classes.hostLabel}>XCM API</span>
          <Text
            span
            ff="monospace"
            fz="xs"
            fw={500}
            c="dimmed"
            visibleFrom="xs"
          >
            {window.location.host}
          </Text>
        </span>
      </Group>
      <Group gap="sm" wrap="nowrap">
        <ThemeToggle size={38} iconSize={18} />
        <Button
          component="a"
          href={DOCS_LINKS.xcmApi}
          target="_blank"
          rel="noopener"
          variant="default"
          h={38}
          px={14}
          fz="sm"
          fw={600}
          rightSection={<IconArrowUpRight size={16} />}
        >
          API docs
        </Button>
      </Group>
    </Group>
  );
};
