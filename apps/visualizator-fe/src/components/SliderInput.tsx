import { Slider, Stack, StackProps, Text } from '@mantine/core';
import { FC } from 'react';

type Props = StackProps & {
  value: number;
  onCustomChange: (value: number) => void;
  min?: number;
  max?: number;
};

const SliderInput: FC<Props> = ({ value, onCustomChange, min, max, ...props }) => {
  return (
    <Stack gap={4} {...props}>
      <Text size="sm" fw={500}>
        Select threshold
      </Text>
      <Slider min={min} max={max} value={value} onChange={onCustomChange} />
    </Stack>
  );
};

export default SliderInput;
