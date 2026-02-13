import {
  Box,
  Collapse,
  Group,
  Text,
  ThemeIcon,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import { IconChevronRight } from '@tabler/icons-react';
import cx from 'clsx';
import type { FC } from 'react';
import { useState } from 'react';
import { NavLink, useLocation } from 'react-router';

import type { TNavItem } from '../../types';
import classes from './LinksGroup.module.css';

type Props = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: React.FC<any>;
  label: string;
  initiallyOpened?: boolean;
  url?: string;
  links?: TNavItem[];
  collapsed?: boolean;
  forceActiveWhenCollapsed?: boolean;
};

export const LinksGroup: FC<Props> = ({
  icon: Icon,
  label,
  initiallyOpened,
  url,
  links,
  collapsed = false,
  forceActiveWhenCollapsed = false,
}) => {
  const { pathname } = useLocation();
  const hasLinks = Array.isArray(links);
  const [opened, setOpened] = useState(initiallyOpened || false);
  const displayChildren = hasLinks && !collapsed;
  const isChildRouteActive = hasLinks
    ? links.some((linkItem) => linkItem.url === pathname)
    : false;
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
      className={cx(classes.link, { [classes.linkCollapsed]: collapsed })}
    >
      <Icon size={12} />
      {!collapsed && <Text className={classes.linkText}>{label}</Text>}
    </Group>
  ));

  return (
    <>
      <Tooltip
        label={label}
        position="right"
        disabled={!collapsed}
        openDelay={120}
        withArrow
      >
        <UnstyledButton
          renderRoot={({ className, ...others }) => (
            <NavLink
              className={({ isActive }) =>
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                cx(className, {
                  'active-link':
                    (isActive && url && !hasLinks) ||
                    (collapsed &&
                      forceActiveWhenCollapsed &&
                      (isActive || isChildRouteActive)),
                })
              }
              to={url}
              {...others}
            />
          )}
          onClick={(event) => {
            if (displayChildren) {
              event.preventDefault();
              setOpened((o) => !o);
            }
          }}
          className={cx(classes.control, {
            [classes.controlCollapsed]: collapsed,
          })}
          aria-label={collapsed ? label : undefined}
        >
          <Group justify={collapsed ? 'center' : 'space-between'} gap={0}>
            <Box style={{ display: 'flex', alignItems: 'center' }}>
              <ThemeIcon variant="light" size={30}>
                <Icon size={18} />
              </ThemeIcon>
              {!collapsed && <Box ml="md">{label}</Box>}
            </Box>
            {displayChildren && (
              <IconChevronRight
                className={classes.chevron}
                stroke={1.5}
                size={16}
                style={{ transform: opened ? 'rotate(-90deg)' : 'none' }}
              />
            )}
          </Group>
        </UnstyledButton>
      </Tooltip>
      {displayChildren ? <Collapse in={opened}>{items}</Collapse> : null}
    </>
  );
};
