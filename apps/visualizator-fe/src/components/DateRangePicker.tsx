import { type FC } from 'react';
import { DatePickerInput } from '@mantine/dates';
import { rem } from '@mantine/core';
import { IconCalendar } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

type Props = {
  value: [Date | null, Date | null];
  setValue: (value: [Date | null, Date | null]) => void;
};

const DateRangePicker: FC<Props> = ({ value, setValue, ...props }) => {
  const { t } = useTranslation();
  const icon = <IconCalendar style={{ width: rem(18), height: rem(18) }} stroke={1.5} />;

  return (
    <DatePickerInput
      type="range"
      label={t('selectDateRange')}
      placeholder={t('selectDateRange')}
      leftSection={icon}
      leftSectionPointerEvents="none"
      value={value}
      onChange={setValue}
      flex={1}
      {...props}
    />
  );
};

export default DateRangePicker;
