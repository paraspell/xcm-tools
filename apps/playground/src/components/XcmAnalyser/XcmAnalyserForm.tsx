import { Button, JsonInput, Paper, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { parseAsBoolean, parseAsString, useQueryStates } from 'nuqs';
import { type FC, useEffect } from 'react';

import { XcmApiCheckbox } from '../common/XcmApiCheckbox';

const PLACEHOLDER_LOCATION = `{
  "parents": 1,
  "interior": {
    "X1": {
      "Parachain": 1000
    }
  }
}`;

export type FormValues = {
  input: string;
  useApi: boolean;
};

type Props = {
  onSubmit: (values: FormValues) => void;
  loading: boolean;
};

const AnalyserForm: FC<Props> = ({ onSubmit, loading }) => {
  const [queryState, setQueryState] = useQueryStates({
    input: parseAsString.withDefault(''),
    useApi: parseAsBoolean.withDefault(false),
  });

  const form = useForm<FormValues>({
    initialValues: queryState,
  });

  useEffect(() => {
    void setQueryState(form.values);
  }, [form.values, setQueryState]);

  return (
    <Paper p="xl" shadow="md">
      <form onSubmit={form.onSubmit(onSubmit)}>
        <Stack gap="lg">
          <JsonInput
            label="XCM Location"
            description="Enter the location in JSON format"
            placeholder={PLACEHOLDER_LOCATION}
            formatOnBlur
            autosize
            minRows={10}
            required
            withAsterisk={false}
            data-testid="input"
            {...form.getInputProps('input')}
          />

          <XcmApiCheckbox
            {...form.getInputProps('useApi', { type: 'checkbox' })}
          />

          <Button type="submit" loading={loading} data-testid="submit">
            Convert
          </Button>
        </Stack>
      </form>
    </Paper>
  );
};

export default AnalyserForm;
