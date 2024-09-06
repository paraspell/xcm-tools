// Contains tests for different Asset queries used in XCM call creation

import { describe, expect, it } from 'vitest'
import { NODE_NAMES } from '../../maps/consts'
import { getAssetsObject } from './assets'
import { getAssetBySymbolOrId } from './getAssetBySymbolOrId'
import { getDefaultPallet } from '../pallets'
import { isRelayChain } from '../../utils'
import { TNodePolkadotKusama } from '../../types'

describe('getAssetBySymbolOrId', () => {
  it('should return assetId and symbol for every foreign asset', () => {
    NODE_NAMES.forEach(node => {
      const { otherAssets } = getAssetsObject(node)
      otherAssets.forEach(other => {
        if (other.symbol !== undefined) {
          const otherAssetsMatches = otherAssets.filter(
            ({ symbol: assetSymbol }) => assetSymbol?.toLowerCase() === other.symbol?.toLowerCase()
          )
          if (otherAssetsMatches.length < 2) {
            const asset = getAssetBySymbolOrId(node, { symbol: other.symbol })
            expect(asset).toHaveProperty('symbol')
            expect(other.symbol.toLowerCase()).toEqual(asset?.symbol?.toLowerCase())
            if (
              !isRelayChain(node) &&
              node !== 'Ethereum' &&
              getDefaultPallet(node as TNodePolkadotKusama) === 'XTokens'
            ) {
              expect(asset).toHaveProperty('assetId')
            }
          }
        }
      })
    })
  })

  it('should return symbol for every native asset', () => {
    NODE_NAMES.forEach(node => {
      const { nativeAssets } = getAssetsObject(node)
      nativeAssets.forEach(other => {
        const asset = getAssetBySymbolOrId(node, { symbol: other.symbol }, true)
        expect(other.symbol.toLowerCase()).toEqual(asset?.symbol?.toLowerCase())
        expect(asset).toHaveProperty('symbol')
      })
    })
  })

  it('should return assetId and symbol for every foreign asset id', () => {
    NODE_NAMES.forEach(node => {
      const { otherAssets } = getAssetsObject(node)
      otherAssets.forEach(other => {
        const asset = getAssetBySymbolOrId(node, { id: other.assetId })
        expect(asset).toHaveProperty('assetId')
        expect(other.assetId).toEqual(asset?.assetId)
      })
    })
  })

  it('should return symbol for every native foreign asset id', () => {
    NODE_NAMES.forEach(node => {
      const { nativeAssets } = getAssetsObject(node)
      nativeAssets.forEach(other => {
        if (other.assetId !== undefined) {
          const asset = getAssetBySymbolOrId(node, { id: other.assetId })
          expect(asset).toHaveProperty('symbol')
          expect(asset).toHaveProperty('assetId')
          expect(Number(other.assetId)).toEqual(asset?.assetId)
        }
      })
    })
  })

  it('should return symbol for every node relay chain asset symbol', () => {
    NODE_NAMES.forEach(node => {
      const { relayChainAssetSymbol } = getAssetsObject(node)
      const asset = getAssetBySymbolOrId(node, { symbol: relayChainAssetSymbol }, true)
      expect(asset).toHaveProperty('symbol')
    })
  })

  it('should find assetId for KSM asset in AssetHubKusama', () => {
    const asset = getAssetBySymbolOrId('AssetHubKusama', { symbol: 'PNEO' })
    expect(asset).toHaveProperty('symbol')
    expect(asset).toHaveProperty('assetId')
  })
})
