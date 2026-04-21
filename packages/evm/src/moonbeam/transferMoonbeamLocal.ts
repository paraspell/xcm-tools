import type { TAssetInfo, WithAmount } from "@paraspell/sdk-core";
import { assertHasId, type TEvmBuilderOptions } from "@paraspell/sdk-core";
import type { createPublicClient } from "viem";
import { getContract } from "viem";

const abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "recipient_",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount_",
        type: "uint256",
      },
    ],
    name: "transfer",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
];

export const transferMoonbeamLocal = async <TApi, TRes, TSigner>(
  client: ReturnType<typeof createPublicClient>,
  assetInfo: WithAmount<TAssetInfo>,
  { signer, recipient }: TEvmBuilderOptions<TApi, TRes, TSigner>,
): Promise<string> => {
  assertHasId(assetInfo);

  const contract = getContract({
    abi,
    address: assetInfo.assetId as `0x${string}`,
    client: {
      public: client,
      wallet: signer,
    },
  });

  return contract.write.transfer([
    recipient as `0x${string}`,
    assetInfo.amount,
  ]);
};
