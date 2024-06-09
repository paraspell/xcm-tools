import { FC } from 'react';
import { DatePickerInput } from '@mantine/dates';
import { rem } from '@mantine/core';
import { IconCalendar } from '@tabler/icons-react';

type Props = {
  value: [Date | null, Date | null];
  setValue: (value: [Date | null, Date | null]) => void;
};

const DateRangePicker: FC<Props> = ({ value, setValue, ...props }) => {
  const icon = <IconCalendar style={{ width: rem(18), height: rem(18) }} stroke={1.5} />;

  return (
    <DatePickerInput
      type="range"
      label="Select date range"
      placeholder="Select date range"
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
