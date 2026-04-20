import { Button, Menu } from '@mantine/core';
import {
  Icon123,
  IconArrowBarDown,
  IconArrowBarToRight,
  IconArrowBarUp,
  IconChecks,
  IconChevronDown,
  IconCoinFilled,
  IconFileInfo,
  IconLocationCheck,
  IconLocationQuestion,
  IconPlus,
  IconTrash,
} from '@tabler/icons-react';
import type { FC } from 'react';

import type { TFormValues, TQuerySubmitType } from '../../types';

type Props = {
  initialValues?: TFormValues;
  showSwapItems: boolean;
  onDryRun: () => void;
  onDryRunPreview: () => void;
  onAddToBatch: () => void;
  onDeleteFromBatch: () => void;
  onQueryAction: (type: TQuerySubmitType) => void;
};

export const XcmActionsMenu: FC<Props> = ({
  initialValues,
  showSwapItems,
  onDryRun,
  onDryRunPreview,
  onAddToBatch,
  onDeleteFromBatch,
  onQueryAction,
}) => {
  const query = (type: TQuerySubmitType) => () => onQueryAction(type);

  return (
    <Menu shadow="md" width={280} position="bottom-end">
      <Menu.Target>
        <Button
          style={{
            borderLeft: '1px solid var(--mantine-color-mainColor-2)',
          }}
        >
          <IconChevronDown />
        </Button>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Item
          leftSection={<IconLocationCheck size={16} />}
          onClick={onDryRun}
        >
          Dry run
        </Menu.Item>

        <Menu.Item
          leftSection={<IconLocationQuestion size={16} />}
          onClick={onDryRunPreview}
        >
          Dry run preview
        </Menu.Item>

        {!initialValues && (
          <Menu.Item
            leftSection={<IconPlus size={16} />}
            onClick={onAddToBatch}
          >
            Add to batch
          </Menu.Item>
        )}

        {initialValues && (
          <Menu.Item
            color="red"
            leftSection={<IconTrash size={16} />}
            onClick={onDeleteFromBatch}
          >
            Delete from batch
          </Menu.Item>
        )}

        <Menu.Divider />
        <Menu.Label>XCM Utils</Menu.Label>

        <Menu.Sub>
          <Menu.Sub.Target>
            <Menu.Sub.Item leftSection={<IconCoinFilled size={16} />}>
              Fees
            </Menu.Sub.Item>
          </Menu.Sub.Target>
          <Menu.Sub.Dropdown>
            <Menu.Item
              leftSection={<IconCoinFilled size={16} />}
              onClick={query('getXcmFee')}
            >
              Get XCM Fee
            </Menu.Item>
            <Menu.Item
              leftSection={<IconCoinFilled size={16} />}
              onClick={query('getOriginXcmFee')}
            >
              Get Origin XCM Fee
            </Menu.Item>
          </Menu.Sub.Dropdown>
        </Menu.Sub>

        <Menu.Sub>
          <Menu.Sub.Target>
            <Menu.Sub.Item leftSection={<IconArrowBarUp size={16} />}>
              Amounts
            </Menu.Sub.Item>
          </Menu.Sub.Target>
          <Menu.Sub.Dropdown>
            <Menu.Item
              leftSection={<IconArrowBarUp size={16} />}
              onClick={query('getTransferableAmount')}
            >
              Get Transferable Amount
            </Menu.Item>
            <Menu.Item
              leftSection={<IconArrowBarDown size={16} />}
              onClick={query('getMinTransferableAmount')}
            >
              Get Min Transferable Amount
            </Menu.Item>
            <Menu.Item
              leftSection={<IconArrowBarToRight size={16} />}
              onClick={query('getReceivableAmount')}
            >
              Get Receivable Amount
            </Menu.Item>
            {showSwapItems && (
              <Menu.Item
                leftSection={<Icon123 size={16} />}
                onClick={query('getBestAmountOut')}
              >
                Get Best Amount Out
              </Menu.Item>
            )}
          </Menu.Sub.Dropdown>
        </Menu.Sub>

        <Menu.Sub>
          <Menu.Sub.Target>
            <Menu.Sub.Item leftSection={<IconFileInfo size={16} />}>
              Info
            </Menu.Sub.Item>
          </Menu.Sub.Target>
          <Menu.Sub.Dropdown>
            <Menu.Item
              leftSection={<IconChecks size={16} />}
              onClick={query('verifyEdOnDestination')}
            >
              Verify ED on Destination
            </Menu.Item>
            <Menu.Item
              leftSection={<IconFileInfo size={16} />}
              onClick={query('getTransferInfo')}
            >
              Get Transfer Info
            </Menu.Item>
          </Menu.Sub.Dropdown>
        </Menu.Sub>
      </Menu.Dropdown>
    </Menu>
  );
};
