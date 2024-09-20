import { Button, JsonInput, Stack } from "@mantine/core";
import { useForm } from "@mantine/form";
import { FC } from "react";

export type FormValues = {
  input: string;
};

type Props = {
  onSubmit: (values: FormValues) => void;
  loading: boolean;
};

const AnalyserForm: FC<Props> = ({ onSubmit, loading }) => {
  const form = useForm<FormValues>({
    initialValues: {
      input: "",
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
          data-testid="input"
          {...form.getInputProps("input")}
        />

        <Button type="submit" loading={loading} data-testid="submit">
          Convert
        </Button>
      </Stack>
    </form>
  );
};

export default AnalyserForm;
