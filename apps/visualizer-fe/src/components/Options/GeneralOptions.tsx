import { ColorInput, Group, Select, Stack, Switch, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';

import { useSelectedParachain } from '../../context/SelectedParachain/useSelectedParachain';
import { CountOption } from '../../gql/graphql';
import LanguageSelect from './LanguageSelect';

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
    setParachainArrangement,
    animationEnabled,
    setAnimationEnabled
  } = useSelectedParachain();

  const onParachainArrangementChange = (value: string | null) => {
    setParachainArrangement(value as CountOption);
  };

  return (
    <Stack gap="sm" pr="lg">
      <ColorInput
        label={t('settings.colors.primaryChannelColor')}
        placeholder={t('settings.colors.selectColor')}
        value={primaryChannelColor}
        onChange={setPrimaryChannelColor}
      />
      <ColorInput
        label={t('settings.colors.highlightedChannelColor')}
        placeholder={t('settings.colors.selectColor')}
        value={highlightedChannelColor}
        onChange={setHighlightedChannelColor}
      />
      <ColorInput
        label={t('settings.colors.secondaryChannelColor')}
        placeholder={t('settings.colors.selectColor')}
        value={secondaryChannelColor}
        onChange={setSecondaryChannelColor}
      />
      <ColorInput
        label={t('settings.colors.selectedChannelColor')}
        placeholder={t('settings.colors.selectColor')}
        value={selectedChannelColor}
        onChange={setSelectedChannelColor}
      />
      <Select
        label={t('settings.layout.arrangement')}
        placeholder={t('settings.layout.selectArrangement')}
        data={[
          { value: CountOption.ORIGIN, label: t('filters.byOrigin') },
          { value: CountOption.DESTINATION, label: t('filters.byDestination') },
          { value: CountOption.BOTH, label: t('filters.byBoth') }
        ]}
        value={parachainArrangement}
        onChange={onParachainArrangementChange}
      />
      <Stack gap={0}>
        <Text size="sm" fw="500">
          {t('settings.animation.title')}
        </Text>
        <Group mt="xs">
          <Switch
            checked={animationEnabled}
            onChange={event => setAnimationEnabled(event.currentTarget.checked)}
            label={t('settings.animation.enableFloatingDesc')}
          />
        </Group>
      </Stack>
      <LanguageSelect />
    </Stack>
  );
};

export default Options;
