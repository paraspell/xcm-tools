import { ActionIcon, Box, Button, Flex, Group, Input, Paper } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconBrandGithubFilled, IconNotes } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

import { useDeviceType } from '../../context/DeviceType/useDeviceType';
import { useSelectedParachain } from '../../context/SelectedParachain/useSelectedParachain';
import { DateRangePicker } from '../DateRangePicker';
import { OptionsModal } from '../Options/OptionsModal';
import { ParachainSelector } from '../ParachainSelector';

export const Footer = () => {
  const { t } = useTranslation();
  const { selectedParachains, setSelectedParachains, dateRange, setDateRange } =
    useSelectedParachain();
  const { isMobile } = useDeviceType();
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <Box pos="absolute" bottom={0} left={0} p="md" w="100%" maw={'100%'}>
      <Flex gap="md" align="end" w="100%">
        {/* Socials */}
        {!isMobile && (
          <Paper p="md" radius="md" bg="rgba(255,255,255,0.8)" flex="0 0 auto">
            <Input.Label>{t('main.bottomBar.resources')}</Input.Label>
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
        )}
        {/* Selectors */}
        <Paper p="md" radius="md" bg="rgba(255,255,255,0.8)" flex={1} miw={0}>
          <Group gap="md" align="end" wrap="nowrap">
            <ParachainSelector
              value={selectedParachains}
              onCustomChange={setSelectedParachains}
              flex={1}
            />
            <DateRangePicker value={dateRange} setValue={setDateRange} />
            <OptionsModal opened={opened} close={close} />
            <Button onClick={open} miw={'95px'}>
              {t('settings.title')}
            </Button>
          </Group>
        </Paper>
      </Flex>
    </Box>
  );
};
