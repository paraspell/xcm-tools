import { ActionIcon, Box, Button, Flex, Group, Input, Paper } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconBrandGithubFilled, IconNotes } from '@tabler/icons-react';
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
      <Flex gap="md" align="end" w="100%">
        <Paper p="md" radius="md" bg="rgba(255,255,255,0.8)" flex="0 0 auto">
          <Input.Label>{t('resources')}</Input.Label>
          <Group gap="sm" wrap="nowrap">
            <ActionIcon
              component="a"
              href="https://github.com/paraspell/xcm-tools/tree/main/apps/visualizer-fe"
              target="_blank"
              color="gray.6"
              size={36}
            >
              <IconBrandGithubFilled size={20} color="white" />
            </ActionIcon>
            <ActionIcon
              component="a"
              href="https://paraspell.github.io/docs/visualizer/getting-start.html"
              target="_blank"
              color="gray.6"
              size={36}
            >
              <IconNotes size={20} color="white" />
            </ActionIcon>
          </Group>
        </Paper>

        <Paper p="md" radius="md" bg="rgba(255,255,255,0.8)" flex={1}>
          <Group gap="md" align="end" wrap="nowrap">
            <ParachainSelector value={parachains} onCustomChange={setParachains} flex={1} />
            <DateRangePicker value={dateRange} setValue={setDateRange} />
            <OptionsModal opened={opened} close={close} />
            <Button onClick={open}>{t('options.title')}</Button>
          </Group>
        </Paper>
      </Flex>
    </Box>
  );
};

export default Footer;
