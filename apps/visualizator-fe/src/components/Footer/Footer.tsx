import { Box, Button, Group, Paper } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';

import { useSelectedParachain } from '../../context/SelectedParachain/useSelectedParachain';
import DateRangePicker from '../DateRangePicker';
import OptionsModal from '../Options/OptionsModal';
import ParachainSelector from '../ParachainSelector';

const Footer = () => {
  const { t } = useTranslation();
  const { parachains, setParachains, dateRange, setDateRange } = useSelectedParachain();
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <Box pos="absolute" bottom={0} left={0} p="xl" w="100%">
      <Paper w="100%" p="md" pt="sm" pb="sm" radius="md" bg="rgba(255,255,255,0.8)">
        <Group align="flex-end">
          <ParachainSelector value={parachains} onCustomChange={setParachains} flex={1} />
          <DateRangePicker value={dateRange} setValue={setDateRange} />
          <OptionsModal opened={opened} close={close} />
          <Button onClick={open}>{t('options.title')}</Button>
        </Group>
      </Paper>
    </Box>
  );
};

export default Footer;
