import {
  ActionIcon,
  Anchor,
  Box,
  Button,
  Group,
  Image,
  Text,
  useMantineColorScheme,
} from '@mantine/core';
import { IconArrowUpRight, IconMoon, IconSun } from '@tabler/icons-react';

import paraspellIcon from '../../assets/paraspell-icon.png';
import { DOCS_URL } from '../../constants';
import classes from './Header.module.css';

export const Header = () => {
  const { toggleColorScheme } = useMantineColorScheme();

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
          href="https://paraspell.xyz/"
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
        <ActionIcon
          size={38}
          onClick={toggleColorScheme}
          aria-label="Toggle dark mode"
          title="Toggle dark mode"
        >
          <Box component={IconMoon} size={18} darkHidden />
          <Box component={IconSun} size={18} lightHidden />
        </ActionIcon>
        <Button
          component="a"
          href={DOCS_URL}
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
