import { Box, Button, ColorInput, Group, Modal, Paper, Select, Stack } from '@mantine/core';
import { useSelectedParachain } from '../../context/SelectedParachain/useSelectedParachain';
import ParachainSelector from '../ParachainSelector';
import DateRangePicker from '../DateRangePicker';
import { useDisclosure } from '@mantine/hooks';
import { CountOption } from '../../gql/graphql';

const Footer = () => {
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
          <Modal opened={opened} onClose={close} title="Edit options">
            <Stack gap="sm">
              <ColorInput
                label="Primary channel color"
                placeholder="Select color"
                value={primaryChannelColor}
                onChange={setPrimaryChannelColor}
              />
              <ColorInput
                label="Highlighted channel color"
                placeholder="Select color"
                value={highlightedChannelColor}
                onChange={setHighlightedChannelColor}
              />
              <ColorInput
                label="Secondary channel color"
                placeholder="Select color"
                value={secondaryChannelColor}
                onChange={setSecondaryChannelColor}
              />
              <ColorInput
                label="Selected channel color"
                placeholder="Select color"
                value={selectedChannelColor}
                onChange={setSelectedChannelColor}
              />
              <Select
                label="Arrangement"
                placeholder="Select arrangement"
                data={[
                  { value: CountOption.ORIGIN, label: 'By origin' },
                  { value: CountOption.DESTINATION, label: 'By destination' },
                  { value: CountOption.BOTH, label: 'By both' }
                ]}
                value={parachainArrangement}
                onChange={onParachainArrangementChange}
              />
            </Stack>
          </Modal>
          <Button onClick={open}>Options</Button>
        </Group>
      </Paper>
    </Box>
  );
};

export default Footer;
