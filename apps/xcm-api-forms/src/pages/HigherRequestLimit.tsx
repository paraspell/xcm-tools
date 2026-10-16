import { Anchor, NumberInput, Stack, Textarea, TextInput } from '@mantine/core';
import {
  isEmail,
  isInRange,
  isNotEmpty,
  matches,
  useForm,
} from '@mantine/form';
import { IconSend } from '@tabler/icons-react';
import { Link, useNavigate } from 'react-router';

import type { HigherLimitRequest } from '../api';
import { submitHigherLimitRequest } from '../api';
import { PageLayout } from '../components/PageLayout/PageLayout';
import { SubmitButton } from '../components/SubmitButton/SubmitButton';
import { ROUTES } from '../constants';
import { useLocationApiKey } from '../hooks/useLocationApiKey';
import { useRecaptchaSubmit } from '../hooks/useRecaptchaSubmit';
import classes from './HigherRequestLimit.module.css';

const API_KEY_REGEX = /^[\w-]+\.[\w-]+\.[\w-]+$/;

export const HigherRequestLimit = () => {
  const navigate = useNavigate();
  const apiKey = useLocationApiKey();
  const { loading, error, submit } = useRecaptchaSubmit('higher_request_limit');

  const form = useForm({
    initialValues: {
      email: '',
      api_key: apiKey ?? '',
      reason: '',
      requestedLimit: '',
    },
    validate: {
      email: isEmail('Enter a valid email address'),
      api_key: (value) =>
        matches(
          API_KEY_REGEX,
          "That doesn't look like an API key",
        )(value.trim()),
      reason: isNotEmpty('Tell us how you plan to use the API'),
      requestedLimit: isInRange({ min: 1 }, 'Use a whole number, e.g. 500'),
    },
    transformValues: ({ email, api_key, reason, requestedLimit }) => ({
      email: email.trim(),
      api_key: api_key.trim(),
      reason: reason.trim(),
      requestedLimit: String(requestedLimit),
    }),
  });

  const onSubmit = (values: HigherLimitRequest) =>
    submit(async (recaptchaResponse) => {
      await submitHigherLimitRequest(values, recaptchaResponse);
      await navigate(ROUTES.submitSuccess);
    });

  return (
    <PageLayout
      documentTitle="Request a Higher Limit"
      tagline="need even more?"
      title="Request a higher limit"
      description="API keys come with 100 requests per minute. If your project needs more, tell us about it — our team reviews each request and replies by email."
    >
      <form onSubmit={form.onSubmit(onSubmit)}>
        <Stack gap="md">
          <TextInput
            label="Email"
            type="email"
            required
            placeholder="your@email.com"
            {...form.getInputProps('email')}
          />
          <TextInput
            label={
              <>
                API key
                <Anchor
                  component={Link}
                  to={ROUTES.generateApiKey}
                  fz={13}
                  fw={600}
                >
                  No key yet? Generate one
                </Anchor>
              </>
            }
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…"
            required
            classNames={{ label: classes.keyLabel, input: classes.keyInput }}
            {...form.getInputProps('api_key')}
          />
          <Textarea
            label="Reason for higher limit"
            placeholder="What are you building, and how will you use the API?"
            rows={4}
            resize="vertical"
            required
            classNames={{ input: classes.reason }}
            {...form.getInputProps('reason')}
          />
          <NumberInput
            label="Requested limit"
            placeholder="e.g. 500"
            allowDecimal={false}
            allowNegative={false}
            hideControls
            required
            rightSection="requests / min"
            rightSectionWidth={128}
            rightSectionPointerEvents="none"
            classNames={{ section: classes.unit }}
            {...form.getInputProps('requestedLimit')}
          />
        </Stack>
        <SubmitButton
          icon={<IconSend size={18} />}
          label="Submit request"
          loadingLabel="Submitting…"
          loading={loading}
          error={error}
        />
      </form>
    </PageLayout>
  );
};
