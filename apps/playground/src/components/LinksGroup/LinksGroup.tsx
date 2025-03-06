import {
  Box,
  Collapse,
  Group,
  Text,
  ThemeIcon,
  UnstyledButton,
} from '@mantine/core';
import { IconChevronRight } from '@tabler/icons-react';
import cx from 'clsx';
import type { FC } from 'react';
import { useState } from 'react';
import { NavLink } from 'react-router-dom';

import type { TNavItem } from '../../types';
import classes from './LinksGroup.module.css';

type Props = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: React.FC<any>;
  label: string;
  initiallyOpened?: boolean;
  url?: string;
  links?: TNavItem[];
};

export const LinksGroup: FC<Props> = ({
  icon: Icon,
  label,
  initiallyOpened,
  url,
  links,
}) => {
  const hasLinks = Array.isArray(links);
  const [opened, setOpened] = useState(initiallyOpened || false);
  const items = (hasLinks ? links : []).map(({ label, url, Icon }) => (
    <Group
      gap={8}
      key={label}
      renderRoot={({ className, ...others }) => (
        <NavLink
          className={({ isActive }) =>
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            cx(className, { 'active-link': isActive })
          }
          to={url}
          {...others}
        />
      )}
      className={classes.link}
    >
      <Icon size={12} />
      <Text className={classes.linkText}>{label}</Text>
    </Group>
  ));

  return (
    <>
      <UnstyledButton
        renderRoot={({ className, ...others }) => (
          <NavLink
            className={({ isActive }) =>
              // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
              cx(className, { 'active-link': isActive && url })
            }
            to={url}
            {...others}
          />
        )}
        onClick={() => setOpened((o) => !o)}
        className={classes.control}
      >
        <Group justify="space-between" gap={0}>
          <Box style={{ display: 'flex', alignItems: 'center' }}>
            <ThemeIcon variant="light" size={30}>
              <Icon size={18} />
            </ThemeIcon>
            <Box ml="md">{label}</Box>
          </Box>
          {hasLinks && (
            <IconChevronRight
              className={classes.chevron}
              stroke={1.5}
              size={16}
              style={{ transform: opened ? 'rotate(-90deg)' : 'none' }}
            />
          )}
        </Group>
      </UnstyledButton>
      {hasLinks ? <Collapse in={opened}>{items}</Collapse> : null}
    </>
  );
};
