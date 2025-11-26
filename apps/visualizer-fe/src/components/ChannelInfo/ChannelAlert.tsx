import {
  Alert,
  Box,
  Button,
  Center,
  Flex,
  Group,
  Loader,
  rem,
  SegmentedControl,
  Stack,
  Text
} from '@mantine/core';
import type { TRelaychain } from '@paraspell/sdk';
import { IconArrowLeft, IconArrowRight } from '@tabler/icons-react';
import dayjs from 'dayjs';
import type { FC } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useDeviceType } from '../../context/DeviceType/useDeviceType';
import { useSelectedParachain } from '../../context/SelectedParachain/useSelectedParachain';
import type { ChannelQuery } from '../../gql/graphql';
import { formatDate } from '../../utils/dateFormatter';
import { getChainNameNoEcosystem } from '../../utils/getChainDisplayName';
import { getParachainById } from '../../utils/utils';

type Props = {
  loading?: boolean;
  channelTo?: ChannelQuery['channel'];
  channelFrom?: ChannelQuery['channel'];
  onClose?: () => void;
};

const ChannelAlert: FC<Props> = ({ loading, channelFrom, channelTo, onClose }) => {
  const { t } = useTranslation();
  const { dateRange } = useSelectedParachain();
  const { isMobile } = useDeviceType();
  const [startDate, endDate] = dateRange;
  const [value, setValue] = useState('from');

  const iconProps = {
    style: { width: rem(20), height: rem(20), display: 'block' },
    stroke: 1.5
  };

  const currentChannel = value === 'from' ? channelFrom : channelTo;
  if (!currentChannel) {
    return;
  }

  const ecosystem = (currentChannel.ecosystem.charAt(0).toUpperCase() +
    currentChannel.ecosystem.slice(1)) as TRelaychain;

  const getLinkByEcosystem = (ecosystem: TRelaychain): string => {
    return `https://${ecosystem.toLowerCase()}.subscan.io/xcm_message?page=1&time_dimension=date`;
  };

  const generateExplorerLink = () => {
    const baseUrl = getLinkByEcosystem(ecosystem);
    const fromChain = `&fromChain=${currentChannel?.sender}`;
    const toChain = `&toChain=${currentChannel?.recipient}`;
    const start = startDate ? `&date_start=${dayjs(startDate).format('YYYY-MM-DD')}` : '';
    const end = endDate ? `&date_end=${dayjs(endDate).format('YYYY-MM-DD')}` : '';

    return `${baseUrl}${fromChain}${toChain}${start}${end}`;
  };

  const padding = isMobile ? '75px' : 'xl';
  const explorerLink = generateExplorerLink();

  const nf = new Intl.NumberFormat('en-US', { maximumFractionDigits: 20 });

  return (
    <Box pos="absolute" top={0} left={0} p={padding}>
      <Alert
        title={t('main.network.channelInfo')}
        withCloseButton
        onClose={onClose}
        w="100%"
        px="md"
        py="sm"
        radius="md"
        bg="rgba(255,255,255,0.8)"
      >
        {loading && (
          <Center h="100%" w="100%">
            <Loader size="xs" />
          </Center>
        )}
        <Stack>
          <Flex>
            <SegmentedControl
              transitionDuration={0}
              withItemsBorders={false}
              value={value}
              onChange={setValue}
              data={[
                {
                  value: 'from',
                  label: getChainNameNoEcosystem(
                    getParachainById(channelFrom?.sender ?? 0, ecosystem)!,
                    ecosystem
                  )
                },
                {
                  value: '_',
                  disabled: true,
                  label:
                    value === 'from' ? (
                      <IconArrowRight {...iconProps} />
                    ) : (
                      <IconArrowLeft {...iconProps} />
                    )
                },
                {
                  value: 'to',
                  label: getChainNameNoEcosystem(
                    getParachainById(channelFrom?.recipient ?? 0, ecosystem)!,
                    ecosystem
                  )
                }
              ]}
            />
          </Flex>

          <Group align="center" gap="xs">
            <Text size="md">{t('charts.common.messageCount')}:</Text>
            <Text fw="bold" size="md">
              {nf.format(currentChannel?.message_count)}
            </Text>
          </Group>
          <Group align="center" gap="xs">
            <Text size="md">{t('main.network.selected.activatedAt')}:</Text>
            <Text fw="bold" size="md">
              {formatDate(dayjs((currentChannel?.active_at ?? 0) * 1000))}{' '}
            </Text>
          </Group>
          <Group>
            <Button component="a" target="_blank" size="xs" href={explorerLink}>
              {t('main.actions.showInExplorer')}
            </Button>
          </Group>
        </Stack>
      </Alert>
    </Box>
  );
};

export default ChannelAlert;
