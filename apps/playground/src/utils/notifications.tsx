import { rem } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';

const xIcon = <IconX style={{ width: rem(20), height: rem(20) }} />;

export const showErrorNotification = (message: string, notifId?: string) => {
  if (notifId) {
    notifications.update({
      id: notifId,
      color: 'red',
      title: 'Error',
      message,
      icon: xIcon,
      loading: false,
      withCloseButton: true,
    });
    return;
  }

  notifications.show({
    title: 'Error',
    color: 'red',
    message,
    icon: xIcon,
  });
};

export const showLoadingNotification = (
  title: string,
  message: string,
  notifId?: string,
) => {
  if (notifId) {
    return notifications.update({
      id: notifId,
      loading: true,
      title,
      message,
      autoClose: false,
      withCloseButton: false,
    });
  }

  return notifications.show({
    id: notifId,
    loading: true,
    title,
    message,
    autoClose: false,
    withCloseButton: false,
  });
};

const checkIcon = <IconCheck size={18} />;

export const showSuccessNotification = (
  notifToUpdateId: string | undefined,
  title: string,
  message: string,
) => {
  if (!notifToUpdateId) {
    return notifications.show({
      color: 'teal',
      title,
      message,
      icon: checkIcon,
      loading: false,
      autoClose: 2000,
    });
  }

  notifications.update({
    id: notifToUpdateId,
    color: 'teal',
    title,
    message: message,
    icon: checkIcon,
    loading: false,
    autoClose: 2000,
  });
};
