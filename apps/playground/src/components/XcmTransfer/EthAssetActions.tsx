import { Button, Group, Text } from '@mantine/core';
import { approveToken, getTokenBalance } from '@paraspell/evm-snowbridge';
import type { FC } from 'react';
import { useCallback, useEffect, useState } from 'react';
import type { Chain, WalletClient } from 'viem';
import { formatUnits, parseUnits } from 'viem';
import { mainnet } from 'viem/chains';

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
  getEvmWalletClient: (chain: Chain) => WalletClient | undefined;
};

const ETHER_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000';

export const EthAssetActions: FC<Props> = ({
  symbol,
  decimals,
  assetId,
  amount,
  isMax,
  getEvmWalletClient,
}) => {
  const isNativeEth = assetId.toLowerCase() === ETHER_TOKEN_ADDRESS;
  const [balance, setBalance] = useState<bigint>();
  const [allowance, setAllowance] = useState<bigint>();
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [approving, setApproving] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  const fetchBalance = useCallback(async () => {
    const client = getEvmWalletClient(mainnet);
    if (!client) return;
    setLoadingBalance(true);
    try {
      const result = await getTokenBalance(client, symbol);
      setBalance(result.balance);
      setAllowance(result.gatewayAllowance);
    } catch (_e) {
      setBalance(undefined);
      setAllowance(undefined);
    } finally {
      setLoadingBalance(false);
    }
  }, [getEvmWalletClient, symbol]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void fetchBalance();
    }, 400);
    return () => window.clearTimeout(handle);
  }, [fetchBalance, refreshToken]);

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
        await approveToken(client, parsedAmount, symbol);
        showSuccessNotification(notifId ?? '', 'Success', `${symbol} approved`);
        setRefreshToken((n) => n + 1);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Approve failed';
        showErrorNotification(message, notifId);
      } finally {
        setApproving(false);
      }
    };
    void run();
  };

  return (
    <Group justify="space-between" gap="xs" wrap="nowrap">
      <Text size="xs" c="dimmed">
        Balance: {loadingBalance ? '…' : formatAmount(balance)} {symbol}
        {!isNativeEth && allowance !== undefined && (
          <>
            {' • '}Approved: {formatAmount(allowance)} {symbol}
          </>
        )}
      </Text>
      {!isNativeEth && (
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
      )}
    </Group>
  );
};
