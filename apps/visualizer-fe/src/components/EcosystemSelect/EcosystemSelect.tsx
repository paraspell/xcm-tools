import { Box, Combobox, Group, Input, InputBase, useCombobox } from '@mantine/core';
import { RELAYCHAINS, type TRelaychain } from '@paraspell/sdk';
import type { FC } from 'react';

import { useSelectedParachain } from '../../context/SelectedParachain/useSelectedParachain';
import KusamaLogo from '../../logos/icons/kusama.svg?react';
import PaseoLogo from '../../logos/icons/paseo.svg?react';
import PolkadotLogo from '../../logos/icons/polkadot.svg?react';
import WestendLogo from '../../logos/icons/westend.svg?react';

type Props = {
  value: string | null;
  onChange: (value: TRelaychain) => void;
};

const EcosystemSelect: FC<Props> = ({ value, onChange }) => {
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption()
  });

  const { setSelectedParachains } = useSelectedParachain();

  const getLogo = (ecosystem: string) => {
    switch (ecosystem) {
      case 'Polkadot':
        return <PolkadotLogo />;
      case 'Kusama':
        return <KusamaLogo />;
      case 'Westend':
        return <WestendLogo />;
      case 'Paseo':
        return <PaseoLogo />;
      default:
        return null;
    }
  };

  const options = RELAYCHAINS.map((value, index) => (
    <Combobox.Option value={value} key={index}>
      <Group gap="xs">
        <Box display="flex" w={16} h={16}>
          {getLogo(value)}
        </Box>
        <Group>{value}</Group>
      </Group>
    </Combobox.Option>
  ));

  return (
    <Combobox
      store={combobox}
      onOptionSubmit={val => {
        onChange(val as TRelaychain);
        setSelectedParachains([]);
        combobox.closeDropdown();
      }}
    >
      <Combobox.Target>
        <InputBase
          component="button"
          type="button"
          pointer
          rightSection={<Combobox.Chevron />}
          rightSectionPointerEvents="none"
          onClick={() => combobox.toggleDropdown()}
        >
          <Group gap="xs">
            <Box display="flex" w={16} h={16}>
              {value ? getLogo(value) : <PolkadotLogo />}
            </Box>
            <Group> {value || <Input.Placeholder>Pick value</Input.Placeholder>}</Group>
          </Group>
        </InputBase>
      </Combobox.Target>

      <Combobox.Dropdown>
        <Combobox.Options>{options}</Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
};

export default EcosystemSelect;
