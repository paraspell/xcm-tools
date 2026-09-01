/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  getJunctionValue,
  hasJunction,
  TJunctionAccountKey20,
  type TLocation,
  type TSubstrateChain
} from '@paraspell/sdk-common'
import { Binary, Keccak256 } from '@polkadot-api/substrate-bindings'
import type { PolkadotClient } from 'polkadot-api'

import { createChainClient } from '../../../sdk-common/scripts/scriptUtils'
import { getParaId, getRelayChainOf } from '../../../sdk-core/src'
import type { TAssetInfoNoLoc } from '../types'
import { decodeSymbol, normalizeLocation } from '../utils/codecUtils'
import { edString } from '../utils'

const ALLOWED_AH_ASSET_SYMBOLS = ['BILL']

const EXCLUDED_ASSET_IDS = ['1000099']

const word = (hex: string) => hex.padStart(64, '0')

const ERC20_PROBE_ACCOUNT = word('11'.repeat(20))
const ERC20_PROBE_BALANCE = '0x' + word((10n ** 18n).toString(16))
const ERC20_BALANCE_OF_SELECTOR = '0x70a08231'
const ERC20_MAX_BALANCE_SLOT = 64

const detectErc20BalanceSlot = async (client: PolkadotClient, contract: string) => {
  for (let slot = 0; slot < ERC20_MAX_BALANCE_SLOT; slot++) {
    const slotKey = Binary.toHex(
      Keccak256(Binary.fromHex(`0x${ERC20_PROBE_ACCOUNT}${word(slot.toString(16))}`))
    )

    const balance = await client._request<string>('eth_call', [
      { to: contract, data: ERC20_BALANCE_OF_SELECTOR + ERC20_PROBE_ACCOUNT },
      'latest',
      { [contract]: { stateDiff: { [slotKey]: ERC20_PROBE_BALANCE } } }
    ])

    if (balance !== '0x' && BigInt(balance) > 0n) return slot
  }

  throw new Error(`Unable to detect the ERC20 balance slot of ${contract}`)
}

const resolveErc20Info = async (
  client: PolkadotClient,
  location: TLocation | undefined,
  finalLocation: TLocation | undefined
) => {
  const contract =
    location &&
    getJunctionValue<TJunctionAccountKey20['AccountKey20']>(location, 'AccountKey20')?.key
  if (!contract) throw new Error(`Missing ERC20 contract in ${JSON.stringify(location)}`)
  const balanceSlot = await detectErc20BalanceSlot(client, contract)
  return finalLocation && hasJunction(finalLocation, 'AccountKey20')
    ? { balanceSlot }
    : { balanceSlot, contract }
}

const HOLLAR_OVERRIDE = {
  location: { parents: 1, interior: { X2: [{ Parachain: 2034 }, { GeneralIndex: 222 }] } },
  isFeeAsset: true
}

const hydrationAssetOverrides: Partial<
  Record<TSubstrateChain, Record<string, { location: TLocation; isFeeAsset?: boolean }>>
> = {
  Hydration: {
    '42': {
      location: {
        parents: 2,
        interior: {
          X2: [
            { GlobalConsensus: { Ethereum: { chainId: 1 } } },
            { AccountKey20: { network: null, key: '0x1abaea1f7c830bd89acc67ec4af516284b1bc33c' } }
          ]
        }
      }
    },
    '222': HOLLAR_OVERRIDE
  },
  HydrationPaseo: {
    '222': HOLLAR_OVERRIDE
  }
}

const resolveAhMetadata = async (location: TLocation, ahApi: any) => {
  const id = getJunctionValue(location, 'GeneralIndex')
  const md = await ahApi.query.Assets.Metadata.getValue(id)
  const symbol = decodeSymbol(md.symbol)
  return ALLOWED_AH_ASSET_SYMBOLS.includes(symbol) ? { symbol, decimals: md.decimals } : null
}

export const fetchHydrationAssets = async (
  client: PolkadotClient,
  chain: TSubstrateChain
): Promise<TAssetInfoNoLoc[]> => {
  const api = client.getUnsafeApi()
  const ahChain: TSubstrateChain = `AssetHub${getRelayChainOf(chain)}`
  const ahClient = createChainClient(ahChain)
  const ahApi = ahClient.getUnsafeApi()

  try {
    const entries = await api.query.AssetRegistry.Assets.getEntries()
    const assets = await Promise.all(
      entries.map(async ({ keyArgs: [id], value }: any) => {
        const assetId = String(id)
        const baseSymbol = decodeSymbol(value.symbol)
        const finalSymbol = chain === 'HydrationPaseo' && assetId === '5' ? 'PAS' : baseSymbol

        const locRaw = await api.query.AssetRegistry.AssetLocations.getValue(id)
        const location = normalizeLocation(locRaw)

        let symbol = finalSymbol ?? ''
        let decimals = value.decimals

        const isAhAsset =
          location &&
          hasJunction(location, 'GeneralIndex') &&
          getJunctionValue(location, 'Parachain') === getParaId(ahChain)

        if (isAhAsset) {
          const resolved = await resolveAhMetadata(location, ahApi)
          if (resolved) {
            symbol = resolved.symbol
            decimals = resolved.decimals
          }
        }

        const override = hydrationAssetOverrides[chain]?.[assetId]
        const finalLocation = override?.location ?? location

        return {
          assetId,
          symbol,
          decimals,
          existentialDeposit: edString(value),
          ...(value.asset_type.type === 'Erc20' && {
            erc20: await resolveErc20Info(client, location, finalLocation)
          }),
          location: finalLocation,
          ...(override?.isFeeAsset && { isFeeAsset: true })
        }
      })
    )

    return assets.filter(
      a =>
        a.decimals && a.decimals > 0 && a.assetId !== '0' && !EXCLUDED_ASSET_IDS.includes(a.assetId)
    )
  } finally {
    ahClient.destroy()
  }
}
