import type { MantineSize } from '@mantine/core';
import { Center, SegmentedControl } from '@mantine/core';
import type { TApiType } from '@paraspell/sdk';
import type { FC } from 'react';

import { PageRoute } from '../PageRoute';
import { DedotLogo } from './assets/DedotLogo';
import { PapiLogo } from './assets/PapiLogo';
import { PolkadotJsLogo } from './assets/PolkadotJsLogo';

type Props = {
  value: TApiType;
  onChange: (apiType: TApiType) => void;
  apiTypeInitialized: boolean;
  size: MantineSize;
};

export const ApiTypeSelector: FC<Props> = ({
  value,
  onChange,
  apiTypeInitialized,
  size,
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
      disabled: fullyDisabled,
      label: (
        <Center style={{ gap: 8 }} data-testid="label-pjs-api">
          <PolkadotJsLogo />
          <span>PJS</span>
        </Center>
      ),
    },
    {
      value: 'DEDOT',
      disabled: fullyDisabled,
      label: (
        <Center style={{ gap: 8 }} data-testid="label-dedot-api">
          <DedotLogo />
          <span>DEDOT</span>
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
