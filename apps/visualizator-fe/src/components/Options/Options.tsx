import { Grid, Text, Title } from '@mantine/core';
import GeneralOptions from './GeneralOptions';
import SkyboxUploadForm from './SkyboxUploadForm';
import { useTranslation } from 'react-i18next';

const Options = () => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'options'
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
          {t('generalTitle')}
        </Title>
        <Text size="sm" mb="md" c="dimmed" pr="lg">
          {t('generalOptionsDesc')}
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
          {t('customSkyboxTitle')}
        </Title>
        <Text size="sm" mb="md" c="dimmed">
          {t('customSkyboxDesc')}
        </Text>
        <SkyboxUploadForm />
      </Grid.Col>
    </Grid>
  );
};

export default Options;
