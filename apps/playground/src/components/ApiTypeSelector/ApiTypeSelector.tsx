import type { MantineSize } from '@mantine/core';
import { Box, Center, Group, SegmentedControl, Select } from '@mantine/core';
import type { TApiType } from '@paraspell/sdk';
import type { FC, ReactNode } from 'react';

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
  const onChangeInternal = (value: string | null) => {
    if (value) onChange(value as TApiType);
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

  const logos: Record<string, ReactNode> = {
    PAPI: <PapiLogo />,
    PJS: <PolkadotJsLogo />,
    DEDOT: <DedotLogo />,
  };

  const selectData = [
    {
      value: 'PAPI',
      label: 'PAPI',
      disabled: fullyDisabled || !apiTypeInitialized,
    },
    { value: 'PJS', label: 'PJS', disabled: fullyDisabled },
    { value: 'DEDOT', label: 'DEDOT', disabled: fullyDisabled },
  ];

  const renderSelectOption = ({
    option,
  }: {
    option: { value: string; label: string };
  }) => (
    <Group gap={8} wrap="nowrap">
      <Box w={16} style={{ flexShrink: 0 }}>
        {logos[option.value]}
      </Box>
      <span>{option.label}</span>
    </Group>
  );

  return (
    <>
      <Box visibleFrom="sm">
        <SegmentedControl
          size={size}
          value={value}
          onChange={onChangeInternal}
          disabled={!apiTypeInitialized}
          data={data}
        />
      </Box>
      <Box hiddenFrom="sm">
        <Select
          value={value}
          onChange={onChangeInternal}
          disabled={!apiTypeInitialized}
          data={selectData}
          size="xs"
          w={110}
          allowDeselect={false}
          leftSection={<Center w={16}>{logos[value]}</Center>}
          leftSectionWidth={34}
          leftSectionProps={{ style: { paddingLeft: 8 } }}
          renderOption={renderSelectOption}
        />
      </Box>
    </>
  );
};
