import { Button, FileInput, rem, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconPhotoUp } from '@tabler/icons-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useSelectedParachain } from '../../context/SelectedParachain/useSelectedParachain';
import { saveImageToDB } from '../../utils/idbUtils';

type FormValues = {
  right: File | null;
  left: File | null;
  top: File | null;
  bottom: File | null;
  front: File | null;
  back: File | null;
};

const SkyboxUploadForm = () => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'options'
  });

  const form = useForm<FormValues>({
    initialValues: {
      right: null,
      left: null,
      top: null,
      bottom: null,
      front: null,
      back: null
    },
    validate: {
      right: value => (value ? undefined : t('imageRequired')),
      left: value => (value ? undefined : t('imageRequired')),
      top: value => (value ? undefined : t('imageRequired')),
      bottom: value => (value ? undefined : t('imageRequired')),
      front: value => (value ? undefined : t('imageRequired')),
      back: value => (value ? undefined : t('imageRequired'))
    }
  });
  const { setSkyboxTrigger } = useSelectedParachain();
  const [loading, setLoading] = useState(false);

  const showSuccessNotification = () => {
    notifications.show({
      title: t('skyboxSaved'),
      message: t('skyboxSaveSuccess'),
      color: 'green'
    });
  };

  const showErrorNotification = () => {
    notifications.show({
      title: t('error'),
      message: t('skyboxSaveError'),
      color: 'red'
    });
  };

  const onSubmit = (values: FormValues) => {
    setLoading(true);
    const promises = Object.entries(values).map(([key, file]) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async e => {
          if (e.target?.result) {
            try {
              const result = e.target.result as string;
              await saveImageToDB(`skybox-${key}`, result);
              resolve(true);
            } catch (error) {
              showErrorNotification();
              reject(new Error('Failed to save image to DB: ' + String(error)));
            }
          } else {
            reject(new Error('File could not be read'));
          }
        };
        reader.onerror = () => reject(new Error('Error reading file'));
        reader.readAsDataURL(file!);
      });
    });

    Promise.all(promises)
      .then(() => {
        setSkyboxTrigger(current => current + 1);
        showSuccessNotification();
      })
      .catch(error => {
        showErrorNotification();
        // eslint-disable-next-line no-console
        console.error('An error occurred while saving images:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const icon = <IconPhotoUp style={{ width: rem(18), height: rem(18) }} stroke={1.5} />;

  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Stack gap="sm">
        <FileInput
          leftSection={icon}
          accept="image/png,image/jpeg"
          label={t('rightImageLabel')}
          placeholder={t('imagePlaceholder')}
          required
          {...form.getInputProps('right')}
        />
        <FileInput
          leftSection={icon}
          accept="image/png,image/jpeg"
          label={t('leftImageLabel')}
          placeholder={t('imagePlaceholder')}
          required
          {...form.getInputProps('left')}
        />
        <FileInput
          leftSection={icon}
          accept="image/png,image/jpeg"
          label={t('topImageLabel')}
          placeholder={t('imagePlaceholder')}
          required
          {...form.getInputProps('top')}
        />
        <FileInput
          leftSection={icon}
          accept="image/png,image/jpeg"
          label={t('bottomImageLabel')}
          placeholder={t('imagePlaceholder')}
          required
          {...form.getInputProps('bottom')}
        />
        <FileInput
          leftSection={icon}
          accept="image/png,image/jpeg"
          label={t('frontImageLabel')}
          placeholder={t('imagePlaceholder')}
          required
          {...form.getInputProps('front')}
        />
        <FileInput
          leftSection={icon}
          accept="image/png,image/jpeg"
          label={t('backImageLabel')}
          placeholder={t('imagePlaceholder')}
          required
          {...form.getInputProps('back')}
        />
        <Button type="submit" loading={loading}>
          {t('saveSkyboxButton')}
        </Button>
      </Stack>
    </form>
  );
};

export default SkyboxUploadForm;
