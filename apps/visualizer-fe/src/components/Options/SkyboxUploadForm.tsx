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
  const { t } = useTranslation();

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
      right: value => (value ? undefined : t('settings.skybox.imageRequired')),
      left: value => (value ? undefined : t('settings.skybox.imageRequired')),
      top: value => (value ? undefined : t('settings.skybox.imageRequired')),
      bottom: value => (value ? undefined : t('settings.skybox.imageRequired')),
      front: value => (value ? undefined : t('settings.skybox.imageRequired')),
      back: value => (value ? undefined : t('settings.skybox.imageRequired'))
    }
  });
  const { setSkyboxTrigger } = useSelectedParachain();
  const [loading, setLoading] = useState(false);

  const showSuccessNotification = () => {
    notifications.show({
      title: t('settings.skybox.messages.saved'),
      message: t('settings.skybox.messages.saveSuccess'),
      color: 'green'
    });
  };

  const showErrorNotification = () => {
    notifications.show({
      title: t('status.error'),
      message: t('settings.skybox.messages.saveError'),
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
              reject(new Error(t('errors.imageSave') + String(error)));
            }
          } else {
            reject(new Error(t('errors.fileRead')));
          }
        };
        reader.onerror = () => reject(new Error(t('errors.fileError')));
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
        console.error(t('errors.image'), error);
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
          label={t('settings.skybox.faces.right')}
          placeholder={t('settings.skybox.imagePlaceholder')}
          required
          {...form.getInputProps('right')}
        />
        <FileInput
          leftSection={icon}
          accept="image/png,image/jpeg"
          label={t('settings.skybox.faces.left')}
          placeholder={t('settings.skybox.imagePlaceholder')}
          required
          {...form.getInputProps('left')}
        />
        <FileInput
          leftSection={icon}
          accept="image/png,image/jpeg"
          label={t('settings.skybox.faces.top')}
          placeholder={t('settings.skybox.imagePlaceholder')}
          required
          {...form.getInputProps('top')}
        />
        <FileInput
          leftSection={icon}
          accept="image/png,image/jpeg"
          label={t('settings.skybox.faces.bottom')}
          placeholder={t('settings.skybox.imagePlaceholder')}
          required
          {...form.getInputProps('bottom')}
        />
        <FileInput
          leftSection={icon}
          accept="image/png,image/jpeg"
          label={t('settings.skybox.faces.front')}
          placeholder={t('settings.skybox.imagePlaceholder')}
          required
          {...form.getInputProps('front')}
        />
        <FileInput
          leftSection={icon}
          accept="image/png,image/jpeg"
          label={t('settings.skybox.faces.back')}
          placeholder={t('settings.skybox.imagePlaceholder')}
          required
          {...form.getInputProps('back')}
        />
        <Button type="submit" loading={loading}>
          {t('settings.skybox.saveButton')}
        </Button>
      </Stack>
    </form>
  );
};

export default SkyboxUploadForm;
