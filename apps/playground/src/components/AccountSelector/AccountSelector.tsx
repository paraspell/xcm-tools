import { Group, Radio, Stack, Text } from '@mantine/core';
import type { FC } from 'react';

import type { TWalletAccount } from '../../types';
import classes from './AccountSelector.module.css';

type Props = {
  accounts: TWalletAccount[];
  value: string | null;
  onChange: (value: string) => void;
};

export const AccountSelector: FC<Props> = ({ accounts, value, onChange }) => {
  const cards = accounts.map(({ address, meta }) => (
    <Radio.Card key={address} value={address} className={classes.root}>
      <Group wrap="nowrap" align="flex-start">
        <Radio.Indicator />
        <div>
          <Text className={classes.label}>{meta.name}</Text>
          <Text className={classes.description}>{address}</Text>
        </div>
      </Group>
    </Radio.Card>
  ));

  return (
    <Radio.Group value={value} onChange={onChange}>
      <Stack gap="xs">{cards}</Stack>
    </Radio.Group>
  );
};
