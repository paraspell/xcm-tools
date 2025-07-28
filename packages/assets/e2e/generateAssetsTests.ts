import {
  getAssetDecimals,
  getAssetId,
  getAssets,
  getAssetsObject,
  getNativeAssets,
  getNativeAssetSymbol,
  getOtherAssets,
  getRelayChainSymbol,
  hasSupportForAsset,
  isNodeEvm
} from '../src'
import { NODES_WITH_RELAY_CHAINS, TNode } from '@paraspell/sdk-common'
import { describe, expect, it } from 'vitest'

export const generateAssetsTests = () => {
  describe('Assets E2E', () => {
    NODES_WITH_RELAY_CHAINS.forEach(node => {
      describe(`getAssetsObject: ${node}`, () => {
        const assetsObj = getAssetsObject(node)

        it('should have asset data defined', () => {
          expect(assetsObj).toBeDefined()
        })

        it('should have the required asset properties', () => {
          expect(assetsObj).toHaveProperty('nativeAssets')
          expect(assetsObj).toHaveProperty('otherAssets')
          expect(assetsObj).toHaveProperty('relayChainAssetSymbol')
          expect(assetsObj).toHaveProperty('nativeAssetSymbol')
          expect(assetsObj).toHaveProperty('isEVM')
          expect(assetsObj).toHaveProperty('supportsDryRunApi')
        })

        if (node !== 'Ethereum') {
          it('should have a valid native asset symbol in nativeAssets', () => {
            const nativeSymbol = getNativeAssetSymbol(node)
            const nativeSymbols = assetsObj.nativeAssets.map(a => a.symbol)
            if (node !== 'BifrostPaseo') {
              expect(nativeSymbols).toContain(nativeSymbol)
            }
          })
        }

        it('Every native asset should have required properties', () => {
          assetsObj.nativeAssets.forEach(asset => {
            expect(asset).toHaveProperty('symbol')
            if (node !== 'Ethereum') expect(asset).toHaveProperty('decimals')
            expect(asset).toHaveProperty('isNative')
            if (
              node !== 'AssetHubPolkadot' &&
              asset.symbol !== 'KSM' &&
              node !== 'AssetHubKusama' &&
              asset.symbol !== 'DOT' &&
              node !== 'Ethereum'
            ) {
              expect(asset).toHaveProperty('existentialDeposit')
            }
          })
        })

        it('Every foreign asset should have required properties', () => {
          assetsObj.otherAssets.forEach(asset => {
            expect(asset).toHaveProperty('symbol')
            if (node !== 'Ethereum') expect(asset).toHaveProperty('decimals')
            expect(asset).toHaveProperty('existentialDeposit')

            // Check that asset has either 'assetId' or 'location'
            expect('assetId' in asset || 'location' in asset).toBe(true)
          })
        })

        it('should support its native asset via hasSupportForAsset', () => {
          const nativeSymbol = assetsObj.nativeAssetSymbol
          if (nativeSymbol && node !== 'BifrostPaseo') {
            expect(hasSupportForAsset(node, nativeSymbol)).toBe(true)
          }
        })
      })

      describe('isNodeEvm', () => {
        it('should return boolean value', () => {
          const value = isNodeEvm(node)
          expect(value).toBeTypeOf('boolean')
        })
      })

      describe('getAssetId', () => {
        it('should return string value for every foreign asset', () => {
          const assets = getOtherAssets(node)
          assets.forEach(asset => {
            const assetId = getAssetId(node as TNode, asset.symbol)
            if (assetId !== null) expect(assetId).toBeTypeOf('string')
          })
        })
      })

      describe('getRelayChainSymbol', () => {
        it('should return string value', () => {
          const value = getRelayChainSymbol(node)
          expect(['KSM', 'DOT', 'WND', 'PAS']).toContain(value)
          expect(value).toBeTypeOf('string')
        })
      })

      describe('getNativeAssets', () => {
        it('should return array of native assets', () => {
          const assets = getNativeAssets(node)
          expect(assets).toBeInstanceOf(Array)
          assets.forEach(asset => {
            expect(asset).toBeTypeOf('object')
            expect(asset).toHaveProperty('symbol')
            expect(asset.symbol).toBeTypeOf('string')
            if (node !== 'Ethereum') expect(asset).toHaveProperty('decimals')
          })
        })
      })

      describe(`getOtherAssets ${node}`, () => {
        it('should return array of other assets', () => {
          const assets = getOtherAssets(node)
          expect(assets).toBeInstanceOf(Array)
          const ethAssets = getOtherAssets('Ethereum')
          assets.forEach(asset => {
            expect(asset).toBeTypeOf('object')
            expect(asset).toHaveProperty('symbol')
            expect(asset.symbol).toBeTypeOf('string')

            if (node === 'AssetHubPolkadot' && ethAssets.find(a => a.symbol === asset.symbol)) {
            }

            const isEthAssetInAhAssets =
              node === 'AssetHubPolkadot' && ethAssets.find(a => a.symbol === asset.symbol)

            if (node !== 'Ethereum' && !isEthAssetInAhAssets)
              expect(asset).toHaveProperty('decimals')

            // Check that asset has either 'assetId' or 'location'
            expect('assetId' in asset || 'location' in asset).toBe(true)
          })
        })

        describe('getAssets', () => {
          it('should return array of assets', () => {
            const assets = getAssets(node)
            expect(assets).toBeInstanceOf(Array)
            assets.forEach(asset => {
              expect(asset).toBeTypeOf('object')
              expect(asset).toHaveProperty('symbol')
              expect(asset.symbol).toBeTypeOf('string')
              if (node !== 'Ethereum') expect(asset).toHaveProperty('decimals')
            })
          })

          it('should return combined list of native and other assets', () => {
            const { nativeAssets, otherAssets } = getAssetsObject(node)
            const assets = getAssets(node)
            expect(assets.length).toEqual(nativeAssets.length + otherAssets.length)
          })
        })

        describe('getAllAssetsSymbols', () => {
          it('should return array of asset symbols', () => {
            const assetsSymbols = getAssets(node).map(asset => asset.symbol)
            expect(assetsSymbols).toBeInstanceOf(Array)
            assetsSymbols.forEach(assetSymbol => {
              expect(assetSymbol).toBeTypeOf('string')
            })
          })

          it('should return combined list of native and other asset symbols', () => {
            const { nativeAssets, otherAssets } = getAssetsObject(node)
            const assetsSymbols = getAssets(node).map(asset => asset.symbol)
            const nativeAssetsSymbols = nativeAssets.map(({ symbol }) => symbol)
            const otherAssetsSymbols = otherAssets.map(({ symbol }) => symbol)
            expect(assetsSymbols).toEqual([...nativeAssetsSymbols, ...otherAssetsSymbols])
          })
        })

        describe('getNativeAssetSymbol', () => {
          it('should return native asset symbol', () => {
            const symbol = getNativeAssetSymbol(node)
            expect(symbol).toBeTypeOf('string')
          })

          if (node !== 'Ethereum') {
            it('should return native asset symbol from native assets', () => {
              const { nativeAssets } = getAssetsObject(node)
              const symbol = getNativeAssetSymbol(node)
              // BifrostPaseo is an exception it has only vBNC in native assets
              if (node !== 'BifrostPaseo') {
                expect(nativeAssets.map(a => a.symbol)).toContain(symbol)
              }
            })
          }
        })

        describe('hasSupportForAsset', () => {
          it('should return boolean value', () => {
            const symbol = getNativeAssetSymbol(node)
            const value = hasSupportForAsset(node, symbol)
            expect(value).toBeTypeOf('boolean')
          })

          it('should return true for native asset', () => {
            const symbol = getNativeAssetSymbol(node)
            const value = hasSupportForAsset(node, symbol)
            if (node !== 'BifrostPaseo') {
              expect(value).toBe(true)
            }
          })

          it('should return true for non-native asset', () => {
            const { otherAssets } = getAssetsObject(node)
            otherAssets.forEach(asset => {
              const value = hasSupportForAsset(node, asset.symbol)
              expect(value).toBe(true)
            })
          })
        })

        describe('getAssetDecimals', () => {
          it('should return valid decimals for all available assets', () => {
            const { nativeAssets, otherAssets } = getAssetsObject(node)
            ;[...nativeAssets, ...otherAssets].forEach(asset => {
              if (asset.symbol !== undefined && asset.decimals !== undefined) {
                const decimals = getAssetDecimals(node, asset.symbol)
                expect(decimals).toBeTypeOf('number')
                expect(decimals).toBeGreaterThanOrEqual(0)
              }
            })
          })
        })

        describe('hasDryRunSupport', () => {
          it('should return boolean value', () => {
            const value = getAssetsObject(node).supportsDryRunApi
            expect(value).toBeTypeOf('boolean')
          })
        })

        describe('getAssetLocation', () => {
          it('should return location for foreign assets', () => {
            const { otherAssets } = getAssetsObject(node)
            otherAssets.forEach(asset => {
              if (asset.location) {
                expect(asset.location).toBeDefined()
              }
            })
          })
        })

        describe('getExistentialDeposit', () => {
          it('should return existential deposit for all assets', () => {
            const { nativeAssets, otherAssets } = getAssetsObject(node)
            ;[...nativeAssets, ...otherAssets].forEach(asset => {
              const deposit = asset.existentialDeposit
              if (deposit !== undefined) {
                expect(deposit).toBeTypeOf('string')
              }
            })
          })
        })
      })
    })
  })
}
