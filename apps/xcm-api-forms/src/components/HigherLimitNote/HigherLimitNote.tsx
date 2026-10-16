import { Anchor, Text } from '@mantine/core';
import { IconArrowRight } from '@tabler/icons-react';
import type { FC } from 'react';
import { Link } from 'react-router';

import { ROUTES } from '../../constants';
import classes from './HigherLimitNote.module.css';

type Props = {
  apiKey?: string;
};

export const HigherLimitNote: FC<Props> = ({ apiKey }) => (
  <Text className={classes.note}>
    Need more than 100 requests per minute?{' '}
    <Anchor
      component={Link}
      to={ROUTES.higherRequestLimit}
      state={{ apiKey }}
      inherit
      className={classes.link}
    >
      Request a higher limit
      <IconArrowRight size={15} />
    </Anchor>
  </Text>
);
