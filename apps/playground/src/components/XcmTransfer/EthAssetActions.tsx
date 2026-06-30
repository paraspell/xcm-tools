import { Button, Group, Text } from '@mantine/core';
import { useCounter } from '@mantine/hooks';
import { approveToken, getTokenBalance } from '@paraspell/evm-snowbridge';
import type { FC } from 'react';
import { useCallback, useEffect, useState } from 'react';
import type { Chain, WalletClient } from 'viem';
import { formatUnits, parseUnits } from 'viem';
import { mainnet } from 'viem/chains';

import { BALANCE_FETCH_DEBOUNCE_MS } from '../../constants';
import { submitEvmApproveFromApi } from '../../utils';
import {
  showErrorNotification,
  showLoadingNotification,
  showSuccessNotification,
} from '../../utils/notifications';

type Props = {
  symbol: string;
  decimals: number;
  assetId: string;
  amount: string;
  isMax?: boolean;
  useApi?: boolean;
  getEvmWalletClient: (chain: Chain) => WalletClient | undefined;
};

const ETHER_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000';

export const EthAssetActions: FC<Props> = ({
  symbol,
  decimals,
  assetId,
  amount,
  isMax,
  useApi,
  getEvmWalletClient,
}) => {
  const isNativeEth = assetId.toLowerCase() === ETHER_TOKEN_ADDRESS;
  const [allowance, setAllowance] = useState<bigint>();
  const [approving, setApproving] = useState(false);
  const [refreshToken, refreshHandlers] = useCounter();

  const fetchAllowance = useCallback(async () => {
    const client = getEvmWalletClient(mainnet);
    if (!client) return;
    try {
      const result = await getTokenBalance(client, symbol);
      setAllowance(result.gatewayAllowance);
    } catch (_e) {
      setAllowance(undefined);
    }
  }, [getEvmWalletClient, symbol]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void fetchAllowance();
    }, BALANCE_FETCH_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [fetchAllowance, refreshToken]);

  const formatAmount = (value: bigint | undefined) =>
    value === undefined ? '…' : formatUnits(value, decimals);

  const parsedAmount = (() => {
    if (isMax || !amount) return undefined;
    try {
      return parseUnits(amount, decimals);
    } catch {
      return undefined;
    }
  })();

  const needsApproval =
    parsedAmount !== undefined &&
    allowance !== undefined &&
    allowance < parsedAmount;

  const onApproveClick = () => {
    const run = async () => {
      const client = getEvmWalletClient(mainnet);
      if (!client) {
        showErrorNotification('Ethereum wallet is not available');
        return;
      }
      if (parsedAmount === undefined) {
        showErrorNotification('Set a valid amount before approving');
        return;
      }
      setApproving(true);
      const notifId = showLoadingNotification(
        'Processing',
        `Approving ${symbol}…`,
      );
      try {
        if (useApi) {
          const sender = client.account?.address;
          if (!sender) {
            throw Error('Connected wallet has no active account');
          }
          await submitEvmApproveFromApi(
            { symbol, amount: parsedAmount, sender },
            client,
          );
        } else {
          await approveToken(client, parsedAmount, symbol);
        }
        showSuccessNotification(notifId ?? '', 'Success', `${symbol} approved`);
        refreshHandlers.increment();
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Approve failed';
        showErrorNotification(message, notifId);
      } finally {
        setApproving(false);
      }
    };
    void run();
  };

  if (isNativeEth) return null;

  return (
    <Group gap="xs" wrap="nowrap">
      <Text size="xs" c="dimmed">
        Approved: {formatAmount(allowance)} {symbol}
      </Text>
      <Button
        size="compact-xs"
        variant="light"
        onClick={onApproveClick}
        loading={approving}
        disabled={!needsApproval}
        data-testid="btn-approve-token"
      >
        Approve
      </Button>
    </Group>
  );
};
