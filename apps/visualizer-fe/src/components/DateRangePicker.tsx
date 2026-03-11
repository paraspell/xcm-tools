import { rem } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconCalendar } from '@tabler/icons-react';
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';

type Props = {
  value: [Date | null, Date | null];
  setValue: (value: [Date | null, Date | null]) => void;
};

export const DateRangePicker: FC<Props> = ({ value, setValue, ...props }) => {
  const { t } = useTranslation();
  const icon = <IconCalendar style={{ width: rem(18), height: rem(18) }} stroke={1.5} />;

  const handleChange = (val: [string | null, string | null]) =>
    setValue(val.map(v => v && new Date(v)) as [Date | null, Date | null]);

  return (
    <DatePickerInput
      type="range"
      label={t('main.bottomBar.dateRange')}
      placeholder={t('filters.select')}
      leftSection={icon}
      leftSectionPointerEvents="none"
      value={value}
      onChange={handleChange}
      flex={1}
      {...props}
      miw={'85px'}
    />
  );
};
