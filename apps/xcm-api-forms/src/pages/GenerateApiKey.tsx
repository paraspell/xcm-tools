import { SimpleGrid, Text } from '@mantine/core';
import { IconKey } from '@tabler/icons-react';
import { useNavigate } from 'react-router';

import { generateApiKey } from '../api';
import { HigherLimitNote } from '../components/HigherLimitNote/HigherLimitNote';
import { LimitTile } from '../components/LimitTile/LimitTile';
import { PageLayout } from '../components/PageLayout/PageLayout';
import { SubmitButton } from '../components/SubmitButton/SubmitButton';
import { ROUTES } from '../constants';
import { useRecaptchaSubmit } from '../hooks/useRecaptchaSubmit';

export const GenerateApiKey = () => {
  const navigate = useNavigate();
  const { loading, error, submit } = useRecaptchaSubmit('generate_api_key');

  const onGenerate = () =>
    submit(async (recaptchaResponse) => {
      const apiKey = await generateApiKey(recaptchaResponse);
      await navigate(ROUTES.showApiKey, { state: { apiKey } });
    });

  return (
    <PageLayout
      documentTitle="Generate API Key"
      tagline="more spells per minute"
      title="Generate your API key"
      description="Get higher request limits on the XCM API. No account needed — one click and it's yours."
      note={<HigherLimitNote />}
    >
      <Text variant="eyebrow">Requests per minute</Text>
      <SimpleGrid cols={{ base: 1, xs: 2 }} spacing="sm" mt={10}>
        <LimitTile label="Without a key" limit={20} />
        <LimitTile label="With an API key" limit={100} withKey />
      </SimpleGrid>
      <SubmitButton
        icon={<IconKey size={18} />}
        label="Generate API key"
        loadingLabel="Generating…"
        loading={loading}
        error={error}
        onClick={onGenerate}
      />
    </PageLayout>
  );
};
