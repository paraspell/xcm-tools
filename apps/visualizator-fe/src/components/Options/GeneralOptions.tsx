import { ColorInput, Select, Stack } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useSelectedParachain } from '../../context/SelectedParachain/useSelectedParachain';
import { CountOption } from '../../gql/graphql';

const Options = () => {
  const { t } = useTranslation();
  const {
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

  const onParachainArrangementChange = (value: string | null) => {
    setParachainArrangement(value as CountOption);
  };

  return (
    <Stack gap="sm" pr="lg">
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
  );
};

export default Options;
