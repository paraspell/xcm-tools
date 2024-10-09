import { Button, Checkbox, JsonInput, Stack } from "@mantine/core";
import { useForm } from "@mantine/form";
import type { FC } from "react";

export type FormValues = {
  input: string;
  useApi: boolean;
};

type Props = {
  onSubmit: (values: FormValues) => void;
  loading: boolean;
};

const AnalyserForm: FC<Props> = ({ onSubmit, loading }) => {
  const form = useForm<FormValues>({
    initialValues: {
      input: "",
      useApi: false,
    },
  });

  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Stack>
        <JsonInput
          placeholder="Enter Multi-Location JSON here"
          formatOnBlur
          autosize
          minRows={10}
          required
          data-testid="input"
          {...form.getInputProps("input")}
        />
        <Checkbox
          label="Use XCM API"
          {...form.getInputProps("useApi")}
          data-testid="checkbox-api"
        />
        <Button type="submit" loading={loading} data-testid="submit">
          Convert
        </Button>
      </Stack>
    </form>
  );
};

export default AnalyserForm;
