import { Box, Button, ColorInput, Group, Modal, Paper, Select, Stack } from '@mantine/core';
import { useSelectedParachain } from '../../context/SelectedParachain/useSelectedParachain';
import ParachainSelector from '../ParachainSelector';
import DateRangePicker from '../DateRangePicker';
import { useDisclosure } from '@mantine/hooks';
import { CountOption } from '../../gql/graphql';
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation();
  const {
    parachains,
    setParachains,
    dateRange,
    setDateRange,
    primaryChannelColor,
    setPrimaryChannelColor,
    highlightedChannelColor,
    setHighlightedChannelColor,
    secondaryChannelColor,
    setSecondaryChannelColor,
    selectedChannelColor,
    setSelectedChannelColor,
    parachainArrangement,
    setParachainArrangement
  } = useSelectedParachain();
  const [opened, { open, close }] = useDisclosure(false);

  const onParachainArrangementChange = (value: string | null) => {
    setParachainArrangement(value as CountOption);
  };

  return (
    <Box pos="absolute" bottom={0} left={0} p="xl" w="100%">
      <Paper w="100%" p="md" pt="sm" pb="sm" radius="md" bg="rgba(255,255,255,0.8)">
        <Group align="flex-end">
          <ParachainSelector value={parachains} onCustomChange={setParachains} flex={1} />
          <DateRangePicker value={dateRange} setValue={setDateRange} />
          <Modal opened={opened} onClose={close} title={t('editOptions')}>
            <Stack gap="sm">
              <ColorInput
                label={t('primaryChannelColor')}
                placeholder={t('selectColor')}
                value={primaryChannelColor}
                onChange={setPrimaryChannelColor}
              />
              <ColorInput
                label={t('highlightedChannelColor')}
                placeholder={t('selectColor')}
                value={highlightedChannelColor}
                onChange={setHighlightedChannelColor}
              />
              <ColorInput
                label={t('secondaryChannelColor')}
                placeholder={t('selectColor')}
                value={secondaryChannelColor}
                onChange={setSecondaryChannelColor}
              />
              <ColorInput
                label={t('selectedChannelColor')}
                placeholder={t('selectColor')}
                value={selectedChannelColor}
                onChange={setSelectedChannelColor}
              />
              <Select
                label={t('arrangement')}
                placeholder={t('selectArrangement')}
                data={[
                  { value: CountOption.ORIGIN, label: t('byOrigin') },
                  { value: CountOption.DESTINATION, label: t('byDestination') },
                  { value: CountOption.BOTH, label: t('byBoth') }
                ]}
                value={parachainArrangement}
                onChange={onParachainArrangementChange}
              />
            </Stack>
          </Modal>
          <Button onClick={open}>{t('options')}</Button>
        </Group>
      </Paper>
    </Box>
  );
};

export default Footer;
