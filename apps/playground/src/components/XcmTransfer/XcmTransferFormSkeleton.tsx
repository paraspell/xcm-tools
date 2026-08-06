import { Fieldset, Group, Input, Paper, Skeleton, Stack } from '@mantine/core';
import type { FC, PropsWithChildren } from 'react';

type FormFieldSkeletonProps = {
  label: string;
  description?: string;
};

const TextSkeleton: FC<PropsWithChildren> = ({ children }) => (
  <Skeleton
    component="span"
    display="inline-block"
    style={{ verticalAlign: 'top' }}
    width="fit-content"
    radius="xl"
  >
    <span>{children}</span>
  </Skeleton>
);

const FormFieldSkeleton: FC<FormFieldSkeletonProps> = ({
  label,
  description,
}) => (
  <Input.Wrapper
    flex={1}
    label={<TextSkeleton>{label}</TextSkeleton>}
    description={
      description ? <TextSkeleton>{description}</TextSkeleton> : undefined
    }
  >
    <Skeleton height={36} radius="lg" mt={description ? 5 : 0} />
  </Input.Wrapper>
);

const CheckboxSkeleton = ({
  width,
  size = 16,
}: {
  width: number;
  size?: number;
}) => (
  <Group gap="xs" wrap="nowrap">
    <Skeleton height={size} width={size} radius="lg" />
    <Skeleton height={9} width={width} radius="xl" />
  </Group>
);

const AddActionSkeleton = ({ width }: { width: number }) => (
  <Group h={46} gap="xs" justify="center">
    <Skeleton height={14} width={14} radius="xl" />
    <Skeleton height={8} width={width} radius="xl" />
  </Group>
);

export const XcmTransferFormSkeleton = () => (
  <Paper
    p="xl"
    shadow="md"
    role="status"
    aria-label="Initializing wallet"
    data-testid="xcm-transfer-form-skeleton"
  >
    <Stack gap="lg">
      <FormFieldSkeleton label="Origin" description="Select the origin chain" />
      <Skeleton height={28} width={28} radius="lg" mx="auto" mb={-12} />
      <FormFieldSkeleton
        label="Destination"
        description="Select the destination chain"
      />

      <Stack gap="md" pb={4}>
        <Fieldset>
          <Stack gap="xs">
            <Stack gap="xs">
              <FormFieldSkeleton label="Currency" />
              <CheckboxSkeleton width={104} />
            </Stack>
            <FormFieldSkeleton label="Amount" />
          </Stack>
        </Fieldset>

        <Group gap="xs" justify="center" h={18}>
          <Skeleton height={14} width={14} radius="xl" />
          <Skeleton height={8} width={92} radius="xl" />
        </Group>
      </Stack>

      <Stack gap="xs">
        <FormFieldSkeleton
          label="Fee asset"
          description="This asset will be used to pay fees"
        />
        <CheckboxSkeleton width={104} />
      </Stack>
      <FormFieldSkeleton
        label="Recipient address"
        description="SS58 or Ethereum address"
      />

      <Stack gap="xs">
        <AddActionSkeleton width={52} />
        <AddActionSkeleton width={72} />
      </Stack>

      <Group gap="lg">
        <CheckboxSkeleton width={76} size={20} />
        <CheckboxSkeleton width={68} size={20} />
      </Group>

      <Paper withBorder px="md" h={50.8} radius="lg">
        <Group justify="space-between" h="100%">
          <Skeleton height={10} width={118} radius="xl" />
          <Skeleton height={18} width={18} radius="xl" />
        </Group>
      </Paper>

      <Paper h={35} py={6} px="xs" radius="lg" bg="orange.0">
        <Group gap="sm" wrap="nowrap">
          <Skeleton height={16} width={16} radius="xl" />
          <Stack gap={5} flex={1}>
            <Skeleton height={9} width={132} radius="xl" />
            <Skeleton height={7} width="72%" radius="xl" />
          </Stack>
          <Skeleton height={14} width={14} radius="xl" />
        </Group>
      </Paper>

      <Skeleton height={36} radius="lg" />
    </Stack>
  </Paper>
);
