import type {
  PolkadotApi,
  TCurrencyCore,
  TGetXcmFeeResult,
  THopTransferInfo,
  TSubstrateChain,
} from '@paraspell/sdk-core';
import { buildHopInfo } from '@paraspell/sdk-core';

type TBuildExecuteSwapHopsOptions<TApi, TRes, TSigner, TCustomChain extends string = never> = {
  api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>;
  hops: TGetXcmFeeResult['hops'];
  originChain: TSubstrateChain;
  exchangeChain: TSubstrateChain;
  currencyFrom: TCurrencyCore;
  currencyTo: TCurrencyCore;
  sender: string;
};

export const buildExecuteSwapHops = async <
  TApi,
  TRes,
  TSigner,
  TCustomChain extends string = never,
>({
  api,
  hops,
  originChain,
  exchangeChain,
  currencyFrom,
  currencyTo,
  sender,
}: TBuildExecuteSwapHopsOptions<TApi, TRes, TSigner, TCustomChain>): Promise<
  THopTransferInfo[]
> => {
  const exchangeHopIdx = hops.findIndex((h) => h.chain === exchangeChain);

  return Promise.all(
    hops.map(async (hop, idx) => {
      const isSwapHop = hop.chain === exchangeChain;
      const isAfterSwap = exchangeHopIdx >= 0 && idx > exchangeHopIdx;
      const result = await buildHopInfo({
        api,
        chain: hop.chain,
        fee: hop.result.fee ?? 0n,
        originChain,
        currency: isAfterSwap ? currencyTo : currencyFrom,
        asset: hop.result.asset,
        sender,
      });
      return {
        chain: hop.chain,
        result: { ...result, ...(isSwapHop && { isExchange: true }) },
      } satisfies THopTransferInfo;
    }),
  );
};
