import {
  Alert,
  Box,
  Center,
  Flex,
  Group,
  Loader,
  rem,
  SegmentedControl,
  Stack,
  Text
} from '@mantine/core';
import { ChannelQuery } from '../../gql/graphql';
import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconArrowLeft, IconArrowRight } from '@tabler/icons-react';
import { getParachainById } from '../../utils/utils';
import { Ecosystem } from '../../types/types';
import dayjs from 'dayjs';

type Props = {
  loading?: boolean;
  channelTo?: ChannelQuery['channel'];
  channelFrom?: ChannelQuery['channel'];
  onClose?: () => void;
};

const ChannelAlert: FC<Props> = ({ loading, channelFrom, channelTo, onClose }) => {
  const { t } = useTranslation();
  const [value, setValue] = useState('from');

  const iconProps = {
    style: { width: rem(20), height: rem(20), display: 'block' },
    stroke: 1.5
  };

  return (
    <Box pos="absolute" top={0} left={0} p="xl">
      <Alert
        title={t('channelInfo')}
        withCloseButton
        onClose={onClose}
        w="100%"
        px="md"
        py="sm"
        radius="md"
        bg="rgba(255,255,255,0.8)"
      >
        {loading && (
          <Center h="100%">
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
                  label: getParachainById(channelFrom?.sender ?? 0, Ecosystem.POLKADOT)
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
                  label: getParachainById(channelFrom?.recipient ?? 0, Ecosystem.POLKADOT)
                }
              ]}
            />
          </Flex>

          <Group align="center" gap="xs">
            <Text size="md">{t('messageCount')}:</Text>
            <Text fw="bold" size="md">
              {value === 'from' ? channelFrom?.message_count : channelTo?.message_count}
            </Text>
          </Group>
          <Group align="center" gap="xs">
            <Text size="md">{t('selectedChannelActiveAt')}:</Text>
            <Text fw="bold" size="md">
              {value === 'from'
                ? dayjs((channelFrom?.active_at ?? 0) * 1000).format('YYYY/MM/DD')
                : dayjs(channelTo?.active_at).format('YYYY/MM/DD')}
            </Text>
          </Group>
        </Stack>
      </Alert>
    </Box>
  );
};

export default ChannelAlert;
