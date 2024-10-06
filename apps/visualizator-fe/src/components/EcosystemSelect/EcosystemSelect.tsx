import { type FC } from 'react';
import { Box, Combobox, Group, Input, InputBase, useCombobox } from '@mantine/core';
import { Ecosystem } from '../../types/types';
import PolkadotLogo from '../../logos/icons/polkadot.svg?react';
import KusamaLogo from '../../logos/icons/kusama.svg?react';
import WestendLogo from '../../logos/icons/westend.svg?react';
import RococoLogo from '../../logos/icons/rococo.svg?react';

type Props = {
  value: string | null;
  onChange: (value: Ecosystem) => void;
};

const EcosystemSelect: FC<Props> = ({ value, onChange }) => {
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption()
  });

  const getLogo = (ecosystem: string) => {
    switch (ecosystem) {
      case 'Polkadot':
        return <PolkadotLogo />;
      case 'Kusama':
        return <KusamaLogo />;
      case 'Westend':
        return <WestendLogo />;
      case 'Rococo':
        return <RococoLogo />;
      default:
        return null;
    }
  };

  const options = Object.entries(Ecosystem).map(([key, value]) => (
    <Combobox.Option value={key} key={key}>
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
        onChange(Ecosystem[val as keyof typeof Ecosystem]);
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
