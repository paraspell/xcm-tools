import { Button, Modal } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import SendXcm from '../SendXcm/SendXcm';
import { useTranslation } from 'react-i18next';

const SendXCMContainer = () => {
  const { t } = useTranslation();
  const [opened, { open, close }] = useDisclosure(false);
  return (
    <>
      <Modal opened={opened} onClose={close}>
        <SendXcm />
      </Modal>
      <Button pos="absolute" right={24} top={24} onClick={open}>
        {t('sendXcm')}
      </Button>
    </>
  );
};

export default SendXCMContainer;
