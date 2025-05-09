import type { MantineSize } from '@mantine/core';
import { Center, SegmentedControl } from '@mantine/core';
import type { FC } from 'react';

import type { TApiType } from '../../types';
import { PageRoute } from '../PageRoute';
import { PapiLogo } from './assets/PapiLogo';
import { PolkadotJsLogo } from './assets/PolkadotJsLogo';

type Props = {
  value: TApiType;
  onChange: (apiType: TApiType) => void;
  apiTypeInitialized: boolean;
  size: MantineSize;
  isUseApiSelected?: boolean;
};

export const ApiTypeSelector: FC<Props> = ({
  value,
  onChange,
  apiTypeInitialized,
  size,
  isUseApiSelected = false,
}) => {
  const onChangeInternal = (value: string) => {
    onChange(value as TApiType);
  };

  const fullyDisabled = location.pathname === PageRoute.XCM_ANALYSER;

  const data = [
    {
      value: 'PAPI',
      disabled: fullyDisabled || !apiTypeInitialized,
      label: (
        <Center style={{ gap: 8 }}>
          <PapiLogo />
          <span>PAPI</span>
        </Center>
      ),
    },
    {
      value: 'PJS',
      disabled:
        fullyDisabled ||
        location.pathname === PageRoute.XCM_ROUTER.toString() ||
        isUseApiSelected,
      label: (
        <Center style={{ gap: 8 }}>
          <PolkadotJsLogo />
          <span>PJS</span>
        </Center>
      ),
    },
  ];

  return (
    <SegmentedControl
      size={size}
      value={value}
      onChange={onChangeInternal}
      disabled={!apiTypeInitialized}
      data={data}
    />
  );
};
