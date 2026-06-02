import { Button, FileButton, Menu } from '@mantine/core';
import { IconDownload, IconSettings, IconUpload } from '@tabler/icons-react';
import type { FC } from 'react';

import { useCustomAssets, useCustomChains } from '../../hooks';
import {
  buildCustomConfig,
  downloadCustomConfig,
  parseCustomConfig,
} from '../../utils/customConfigIO';
import {
  showErrorNotification,
  showSuccessNotification,
} from '../../utils/notifications';

export const CustomConfigMenu: FC = () => {
  const { storedChains, setAllCustomChains } = useCustomChains();
  const { customAssets, setAllCustomAssets } = useCustomAssets();

  const handleExport = () => {
    downloadCustomConfig(buildCustomConfig(storedChains, customAssets));
    showSuccessNotification(
      undefined,
      'Config exported',
      'Your custom chains and assets were downloaded.',
    );
  };

  const handleImport = async (file: File | null) => {
    if (!file) return;
    try {
      const config = parseCustomConfig(await file.text());
      setAllCustomChains(config.customChains);
      setAllCustomAssets(config.customAssets);
      const chainCount = Object.keys(config.customChains).length;
      const assetCount = Object.values(config.customAssets).reduce(
        (sum, list) => sum + (list?.length ?? 0),
        0,
      );
      showSuccessNotification(
        undefined,
        'Config imported',
        `Loaded ${chainCount} custom chain(s) and ${assetCount} custom asset(s).`,
      );
    } catch (err) {
      showErrorNotification(
        err instanceof Error ? err.message : 'Could not import config.',
      );
    }
  };

  return (
    <Menu position="bottom-end" withinPortal>
      <Menu.Target>
        <Button
          variant="default"
          size="xs"
          leftSection={<IconSettings size={16} />}
          style={{ flexShrink: 0 }}
          data-testid="button-custom-config"
        >
          Custom config
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item
          leftSection={<IconDownload size={16} />}
          onClick={handleExport}
          data-testid="button-export-config"
        >
          Export config
        </Menu.Item>
        <FileButton
          onChange={(file) => void handleImport(file)}
          accept="application/json"
        >
          {(props) => (
            <Menu.Item
              {...props}
              leftSection={<IconUpload size={16} />}
              closeMenuOnClick={false}
              data-testid="button-import-config"
            >
              Import config
            </Menu.Item>
          )}
        </FileButton>
      </Menu.Dropdown>
    </Menu>
  );
};
