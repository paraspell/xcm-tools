import { describe, expect, it } from 'vitest'

import { DuplicateAssetError } from '../../errors'
import type { TAssetInfo } from '../../types'
import { findAssetInfoBySymbol } from './findAssetInfoBySymbol'

const ethLocationA = {
  parents: 2,
  interior: {
    X2: [
      { GlobalConsensus: { Ethereum: { chainId: 1 } } },
      {
        AccountKey20: {
          network: null,
          key: '0x7de91b204c1c737bcee6f000aaa6569cf7061cb7'
        }
      }
    ]
  }
} as TAssetInfo['location']

const ethLocationB = {
  parents: 2,
  interior: {
    X2: [
      { GlobalConsensus: { Ethereum: { chainId: 1 } } },
      {
        AccountKey20: {
          network: null,
          key: '0x1f752250f518e419f2f03804e25728c5c6dff73f'
        }
      }
    ]
  }
} as TAssetInfo['location']

// Two distinct ERC20 contracts on Ethereum chainId 1 sharing the symbol XRT,
// mirroring packages/assets/src/maps/assets.json (aliases XRT2 / XRT1).
const ethXrtFirst: TAssetInfo = {
  symbol: 'XRT',
  alias: 'XRT2',
  assetId: '0x7de91b204c1c737bcee6f000aaa6569cf7061cb7',
  decimals: 9,
  existentialDeposit: '1',
  location: ethLocationA
}

const ethXrtSecond: TAssetInfo = {
  symbol: 'XRT',
  alias: 'XRT1',
  assetId: '0x1f752250f518e419f2f03804e25728c5c6dff73f',
  decimals: 9,
  existentialDeposit: '1',
  location: ethLocationB
}

describe('findAssetInfoBySymbol — external destination duplicate guard', () => {
  it('throws DuplicateAssetError when two Ethereum assets share the symbol', () => {
    expect(() => findAssetInfoBySymbol([ethXrtFirst, ethXrtSecond], [], 'XRT', 'Ethereum')).toThrow(
      DuplicateAssetError
    )
  })

  it('throws DuplicateAssetError for a Foreign specifier with an ambiguous symbol', () => {
    expect(() =>
      findAssetInfoBySymbol(
        [ethXrtFirst, ethXrtSecond],
        [],
        { type: 'Foreign', value: 'XRT' },
        'Ethereum'
      )
    ).toThrow(DuplicateAssetError)
  })

  it('control: non-external destination still throws for the same ambiguous input', () => {
    expect(() =>
      findAssetInfoBySymbol([ethXrtFirst, ethXrtSecond], [], 'XRT', 'AssetHubPolkadot')
    ).toThrow(DuplicateAssetError)
  })

  it('resolves a single Ethereum match without throwing', () => {
    expect(findAssetInfoBySymbol([ethXrtFirst], [], 'XRT', 'Ethereum')).toEqual(ethXrtFirst)
  })

  it('returns undefined when no Ethereum asset matches the symbol', () => {
    expect(findAssetInfoBySymbol([ethXrtFirst], [], 'NOTASYMBOL', 'Ethereum')).toBeUndefined()
  })
})
