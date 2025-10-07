import { ActionIcon, Group, Tooltip } from '@mantine/core';
import { IconDownload, IconPhotoDown } from '@tabler/icons-react';
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';

type Props = {
  onDownloadZipClick?: () => void;
  onDownloadSvgClick?: () => void;
  disabled?: boolean;
};

const DownloadButtons: FC<Props> = ({ onDownloadZipClick, onDownloadSvgClick, disabled }) => {
  const { t } = useTranslation();
  return (
    <Group gap="xs">
      {onDownloadZipClick && (
        <Tooltip label={t('charts.common.downloads.downloadZipTooltip')}>
          <ActionIcon onClick={onDownloadZipClick} disabled={disabled} variant="outline" size="sm">
            <IconDownload style={{ width: '70%', height: '70%' }} stroke={1.5} />
          </ActionIcon>
        </Tooltip>
      )}
      {onDownloadSvgClick && (
        <Tooltip label={t('charts.common.downloads.downloadSvgTooltip')}>
          <ActionIcon onClick={onDownloadSvgClick} disabled={disabled} variant="outline" size="sm">
            <IconPhotoDown style={{ width: '70%', height: '70%' }} stroke={1.5} />
          </ActionIcon>
        </Tooltip>
      )}
    </Group>
  );
};

export default DownloadButtons;
