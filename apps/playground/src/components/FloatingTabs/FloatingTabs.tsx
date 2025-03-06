import {
  Box,
  FloatingIndicator,
  Group,
  rem,
  UnstyledButton,
} from '@mantine/core';
import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import type { TNavItem } from '../../types';
import classes from './FloatingTabs.module.css';

type Props = {
  data: TNavItem[];
};

export const FloatingTabs: FC<Props> = ({ data }) => {
  const location = useLocation();
  const [rootRef, setRootRef] = useState<HTMLDivElement | null>(null);
  const [controlsRefs, setControlsRefs] = useState<
    Record<string, HTMLAnchorElement | null>
  >({});
  const [active, setActive] = useState(0);

  const setControlRef = (index: number) => (node: HTMLAnchorElement) => {
    controlsRefs[index] = node;
    setControlsRefs(controlsRefs);
  };

  useEffect(() => {
    const activeIndex = data.findIndex((tab) => tab.url === location.pathname);
    if (activeIndex !== -1) {
      setActive(activeIndex);
    }
  }, [location.pathname, data]);

  const iconStyle = { width: rem(14), height: rem(14) };

  const controls = data.map(({ url, label, Icon }, index) => (
    <UnstyledButton
      component={Link}
      key={url}
      className={classes.control}
      ref={setControlRef(index)}
      onClick={() => setActive(index)}
      mod={{ active: active === index }}
      to={url}
    >
      <Group gap={8} className={classes.controlLabel}>
        <Icon style={iconStyle} />
        <span>{label}</span>
      </Group>
    </UnstyledButton>
  ));

  return (
    <Box className={classes.root} visibleFrom="xl" ref={setRootRef}>
      {controls}
      <FloatingIndicator
        target={controlsRefs[active]}
        parent={rootRef}
        className={classes.indicator}
      />
    </Box>
  );
};
