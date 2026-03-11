import { Grid, Text, Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';

import { GeneralOptions } from './GeneralOptions';
import { SkyboxUploadForm } from './SkyboxUploadForm';

export const Options = () => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'settings'
  });
  return (
    <Grid gutter="xl">
      <Grid.Col
        span={{
          base: 12,
          md: 6
        }}
      >
        <Title order={5} mb="xs" pr="lg">
          {t('general.title')}
        </Title>
        <Text size="sm" mb="md" c="dimmed" pr="lg">
          {t('general.description')}
        </Text>
        <GeneralOptions />
      </Grid.Col>
      <Grid.Col
        span={{
          base: 12,
          md: 6
        }}
      >
        <Title order={5} mb="xs">
          {t('skybox.title')}
        </Title>
        <Text size="sm" mb="md" c="dimmed">
          {t('skybox.description')}
        </Text>
        <SkyboxUploadForm />
      </Grid.Col>
    </Grid>
  );
};
