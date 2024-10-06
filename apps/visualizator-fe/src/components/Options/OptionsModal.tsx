import type { FC } from 'react';
import { Modal, Title } from '@mantine/core';
import Options from './Options';
import { useTranslation } from 'react-i18next';

type Props = {
  opened: boolean;
  close: () => void;
};

const OptionsModal: FC<Props> = ({ opened, close }) => {
  const { t } = useTranslation();
  return (
    <Modal.Root opened={opened} onClose={close} size="xl">
      <Modal.Overlay backgroundOpacity={0.55} blur={3} />
      <Modal.Content>
        <Modal.Header pb="xs">
          <Title order={4}>{t('editOptions')}</Title>
          <Modal.CloseButton />
        </Modal.Header>
        <Modal.Body p="lg">
          <Options />
        </Modal.Body>
      </Modal.Content>
    </Modal.Root>
  );
};

export default OptionsModal;
