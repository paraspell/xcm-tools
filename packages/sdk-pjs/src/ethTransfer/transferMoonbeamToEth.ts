/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { blake2AsHex, decodeAddress } from '@polkadot/util-crypto'
import type { BytesLike, TransactionResponse } from 'ethers'
import { Contract } from 'ethers'
import { numberToHex, u8aToHex } from '@polkadot/util'
import { calculateFee } from '@paraspell/sdk-core'
import abi from './abi-xcm.json' with { type: 'json' }
import type { TMultiLocation } from '@paraspell/sdk-core'
import {
  findAssetByMultiLocation,
  getAssetBySymbolOrId,
  getOtherAssets,
  getParaId,
  InvalidCurrencyError,
  isForeignAsset,
  isOverrideMultiLocationSpecifier,
  type TEvmBuilderOptions
} from '@paraspell/sdk-core'
import { isEthersContract, isEthersSigner } from './utils'
import type { WriteContractReturnType } from 'viem'
import { createPublicClient, getContract, http } from 'viem'
import { ETH_CHAIN_ID, ETHEREUM_JUNCTION } from '@paraspell/sdk-core'
import type { TPjsApi } from '../types'

// https://github.com/moonbeam-foundation/moonbeam/blob/b2b1bde7ced13aad4bd2928effc415c521fd48cb/runtime/moonbeam/src/precompiles.rs#L281
const xcmInterfacePrecompile = '0x000000000000000000000000000000000000081A'
const XCDOT = '0xFfFFfFff1FcaCBd218EDc0EbA20Fc2308C778080'

export const transferMoonbeamToEth = async <TApi, TRes>({
  api,
  from,
  to,
  signer,
  address,
  ahAddress,
  currency
}: TEvmBuilderOptions<TApi, TRes>) => {
  if ('multiasset' in currency) {
    throw new Error('Multiassets syntax is not supported for Evm transfers')
  }

  if ('multilocation' in currency && isOverrideMultiLocationSpecifier(currency.multilocation)) {
    throw new Error('Override multilocation is not supported for Evm transfers')
  }

  const foundAsset = getAssetBySymbolOrId(from, currency, to)

  if (foundAsset === null) {
    throw new InvalidCurrencyError(
      `Origin node ${from} does not support currency ${JSON.stringify(currency)}.`
    )
  }

  if (!isForeignAsset(foundAsset) || !foundAsset.multiLocation) {
    throw new InvalidCurrencyError('Currency must be a foreign asset with valid multi-location')
  }

  const ethAsset = findAssetByMultiLocation(
    getOtherAssets('Ethereum'),
    foundAsset.multiLocation as TMultiLocation
  )

  if (!ethAsset) {
    throw new InvalidCurrencyError(
      `Could not obtain Ethereum asset address for ${JSON.stringify(foundAsset)}`
    )
  }

  const contract = isEthersSigner(signer)
    ? new Contract(xcmInterfacePrecompile, abi, signer)
    : getContract({
        abi,
        address: xcmInterfacePrecompile,
        client: {
          public: createPublicClient({
            chain: signer.chain,
            transport: http()
          }),
          wallet: signer
        }
      })

  const BRIDGE_LOCATION = {
    parents: 2,
    interior: {
      X1: [ETHEREUM_JUNCTION]
    }
  }
  const ERC20_TOKEN_LOCATION = {
    parents: 2,
    interior: {
      X2: [
        { GlobalConsensus: { Ethereum: { chain_id: ETH_CHAIN_ID } } },
        { AccountKey20: { key: foundAsset.assetId } }
      ]
    }
  }
  const ERC20_TOKEN_LOCATION_REANCHORED = {
    parents: 0,
    interior: { X1: [{ AccountKey20: { key: foundAsset.assetId } }] }
  }

  const customXcm = [
    {
      setAppendix: [
        {
          depositAsset: {
            assets: {
              Wild: 'All'
            },
            beneficiary: {
              parents: 0,
              interior: {
                x1: [
                  {
                    AccountId32: {
                      id: u8aToHex(decodeAddress(ahAddress))
                    }
                  }
                ]
              }
            }
          }
        }
      ]
    },
    {
      initiateReserveWithdraw: {
        assets: {
          Wild: {
            AllOf: { id: ERC20_TOKEN_LOCATION, fun: 'Fungible' }
          }
        },
        reserve: BRIDGE_LOCATION,
        xcm: [
          {
            buyExecution: {
              fees: {
                id: ERC20_TOKEN_LOCATION_REANCHORED, // CAUTION: Must use reanchored locations.
                fun: {
                  Fungible: '1' // Offering 1 unit as fee, but it is returned to the destination address.
                }
              },
              weight_limit: 'Unlimited'
            }
          },
          {
            depositAsset: {
              assets: {
                Wild: {
                  AllCounted: 1
                }
              },
              beneficiary: {
                parents: 0,
                interior: { x1: [{ AccountKey20: { key: address } }] }
              }
            }
          },
          {
            setTopic: '0x0000000000000000000000000000000000000000000000000000000000000000'
          }
        ]
      }
    },
    {
      setTopic: '0x0000000000000000000000000000000000000000000000000000000000000000'
    }
  ]

  await api.init(from)

  const apiPjs = api.getApi() as TPjsApi

  const assetHubApi = await api.createApiForNode('AssetHubPolkadot')
  const assetHubApiPjs = assetHubApi.getApi() as TPjsApi

  // Generate an unique messageId and set into `setTopic` for remote track
  const xcmHash = assetHubApiPjs.createType('Xcm', customXcm)

  const sender = isEthersSigner(signer) ? await signer.getAddress() : signer.account?.address

  const [parachainId, accountNextId] = await Promise.all([
    apiPjs.query.parachainInfo.parachainId(),
    apiPjs.rpc.system.accountNextIndex(sender as string)
  ])

  const entropy = new Uint8Array([
    ...parachainId.toU8a(),
    ...accountNextId.toU8a(),
    ...xcmHash.toU8a()
  ])
  const messageId = blake2AsHex(entropy)
  if (customXcm.length == 2) {
    customXcm[0].initiateReserveWithdraw!.xcm[2].setTopic = messageId
    customXcm[1].setTopic = messageId
  } else if (customXcm.length == 3) {
    customXcm[1].initiateReserveWithdraw!.xcm[2].setTopic = messageId
    customXcm[2].setTopic = messageId
  } else {
    throw new Error('invalid xcm')
  }

  const xcmOnDest = assetHubApiPjs.createType('XcmVersionedXcm', {
    V4: customXcm
  })
  const customXcmOnDest: BytesLike = xcmOnDest.toHex()

  const transferFee = await calculateFee(assetHubApi)

  // Partially inspired by Moonbeam XCM-SDK
  // https://github.com/moonbeam-foundation/xcm-sdk/blob/ab835c15bf41612604b1c858d956a9f07705ed65/packages/sdk/src/contract/contracts/Xtokens/Xtokens.ts#L53
  const createTx = (
    func: string,
    args: unknown[]
  ): Promise<TransactionResponse | WriteContractReturnType> => {
    if (isEthersContract(contract)) {
      return contract[func](...args)
    }

    return contract.write[func](args as any)
  }

  // Execute the custom XCM message with the precompile
  const tx = await createTx(
    isEthersSigner(signer)
      ? 'transferAssetsUsingTypeAndThenAddress((uint8,bytes[]),(address,uint256)[],uint8,uint8,uint8,bytes)'
      : 'transferAssetsUsingTypeAndThenAddress',
    [
      // This represents (1,X1(Parachain(1000)))
      [1, ['0x00' + numberToHex(getParaId('AssetHubPolkadot'), 32).slice(2)]],
      // Assets including fee and the ERC20 asset, with fee be the first
      [
        [XCDOT, transferFee],
        [ethAsset.assetId, currency.amount]
      ],
      // The TransferType corresponding to asset being sent, 2 represents `DestinationReserve`
      2,
      // index for the fee
      0,
      // The TransferType corresponding to fee asset
      2,
      customXcmOnDest
    ]
  )

  return typeof tx === 'object' ? tx.hash : tx
}
