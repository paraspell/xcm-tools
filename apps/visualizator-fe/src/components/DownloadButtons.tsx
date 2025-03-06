import { ActionIcon, Group, Tooltip } from '@mantine/core';
import { IconDownload, IconPhotoDown } from '@tabler/icons-react';
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';

type Props = {
  onDownloadZipClick: () => void;
  onDownloadSvgClick: () => void;
};

const DownloadButtons: FC<Props> = ({ onDownloadZipClick, onDownloadSvgClick }) => {
  const { t } = useTranslation();
  return (
    <Group gap="xs">
      <Tooltip label={t('downloadZipTooltip')}>
        <ActionIcon onClick={onDownloadZipClick} variant="outline" size="sm">
          <IconDownload style={{ width: '70%', height: '70%' }} stroke={1.5} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label={t('downloadSvgTooltip')}>
        <ActionIcon onClick={onDownloadSvgClick} variant="outline" size="sm">
          <IconPhotoDown style={{ width: '70%', height: '70%' }} stroke={1.5} />
        </ActionIcon>
      </Tooltip>
    </Group>
  );
};

export default DownloadButtons;
