import type {
  ComboboxData,
  ComboboxItem,
  ComboboxLikeRenderOptionInput,
  InputBaseProps,
} from '@mantine/core';
import {
  CloseButton,
  Combobox,
  Group,
  InputBase,
  ScrollArea,
  UnstyledButton,
  useCombobox,
} from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import classes from './ComboboxSelect.module.css';

export type ComboboxSelectProps = Omit<
  InputBaseProps,
  'value' | 'defaultValue' | 'onChange' | 'rightSection'
> & {
  data?: ComboboxData;
  value?: string | null;
  onChange?: (value: string | null, option: ComboboxItem) => void;
  placeholder?: string;
  clearable?: boolean;
  renderOption?: (
    input: ComboboxLikeRenderOptionInput<ComboboxItem>,
  ) => ReactNode;
  onClear?: () => void;
  onAddCustom?: () => void;
  addCustomLabel?: string;
  addCustomTestId?: string;
  'data-testid'?: string;
};

const toItems = (data?: ComboboxData): ComboboxItem[] =>
  (data ?? []).map((item) =>
    typeof item === 'string'
      ? { value: item, label: item }
      : (item as ComboboxItem),
  );

export const ComboboxSelect = ({
  data,
  value,
  onChange,
  placeholder = 'Pick value',
  required = true,
  leftSection,
  clearable,
  renderOption,
  onClear,
  onAddCustom,
  addCustomLabel,
  addCustomTestId,
  'data-testid': dataTestId,
  ...inputBaseProps
}: ComboboxSelectProps) => {
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
    onDropdownOpen: () => combobox.updateSelectedOptionIndex('active'),
  });

  const items = toItems(data);
  const selected = items.find((i) => i.value === value);
  const selectedLabel = selected?.label ?? '';

  const [search, setSearch] = useState(selectedLabel);

  useEffect(() => {
    setSearch(selectedLabel);
  }, [selectedLabel]);

  const searchQuery =
    search === selectedLabel ? '' : search.trim().toLowerCase();
  const filtered = items.filter((i) =>
    i.label.toLowerCase().includes(searchQuery),
  );

  const showClear = (clearable || !!onClear) && !!value;
  const rightSection = showClear ? (
    <CloseButton
      size="sm"
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => {
        onChange?.(null, { value: '', label: '' });
        onClear?.();
        setSearch('');
      }}
      aria-label="Clear"
    />
  ) : (
    <Combobox.Chevron />
  );

  return (
    <Combobox
      store={combobox}
      withinPortal={false}
      onOptionSubmit={(val) => {
        const picked = items.find((i) => i.value === val) ?? {
          value: val,
          label: val,
        };
        onChange?.(val, picked);
        setSearch(picked.label);
        combobox.closeDropdown();
      }}
    >
      <Combobox.Target>
        <InputBase
          {...inputBaseProps}
          required={required}
          placeholder={placeholder}
          leftSection={leftSection}
          rightSection={rightSection}
          rightSectionPointerEvents={showClear ? 'auto' : 'none'}
          data-testid={dataTestId}
          value={search}
          onChange={(event) => {
            combobox.openDropdown();
            combobox.updateSelectedOptionIndex();
            setSearch(event.currentTarget.value);
          }}
          onClick={() => combobox.openDropdown()}
          onFocus={() => combobox.openDropdown()}
          onBlur={() => {
            combobox.closeDropdown();
            setSearch(selectedLabel);
          }}
        />
      </Combobox.Target>

      <Combobox.Dropdown>
        <Combobox.Options>
          <ScrollArea.Autosize mah={220} type="scroll">
            {filtered.length > 0 ? (
              filtered.map((option) => {
                const checked = option.value === value;
                return (
                  <Combobox.Option
                    key={option.value}
                    value={option.value}
                    active={checked}
                  >
                    {renderOption
                      ? renderOption({ option, checked })
                      : option.label}
                  </Combobox.Option>
                );
              })
            ) : (
              <Combobox.Empty>Nothing found...</Combobox.Empty>
            )}
          </ScrollArea.Autosize>
        </Combobox.Options>
        {onAddCustom && addCustomLabel && (
          <Combobox.Footer className={classes.footer}>
            <UnstyledButton
              className={classes.addCustomButton}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                combobox.closeDropdown();
                onAddCustom();
              }}
              data-testid={addCustomTestId}
            >
              <Group gap="xs">
                <IconPlus size={16} stroke={1.8} />
                <span>{addCustomLabel}</span>
              </Group>
            </UnstyledButton>
          </Combobox.Footer>
        )}
      </Combobox.Dropdown>
    </Combobox>
  );
};
