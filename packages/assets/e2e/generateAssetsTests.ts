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
  isChainEvm
} from '../src'
import { CHAINS, isExternalChain, TChain } from '@paraspell/sdk-common'
import { describe, expect, it } from 'vitest'

export const generateAssetsTests = () => {
  describe('Assets E2E', () => {
    CHAINS.forEach(chain => {
      describe(`getAssetsObject: ${chain}`, () => {
        const assetsObj = getAssetsObject(chain)

        it('should have asset data defined', () => {
          expect(assetsObj).toBeDefined()
        })

        it('should have the required asset properties', () => {
          expect(assetsObj).toHaveProperty('assets')
          expect(assetsObj).toHaveProperty('relaychainSymbol')
          expect(assetsObj).toHaveProperty('nativeAssetSymbol')
          expect(assetsObj).toHaveProperty('isEVM')
          expect(assetsObj).toHaveProperty('supportsDryRunApi')
        })

        if (!isExternalChain(chain)) {
          it('should have a valid native asset symbol in nativeAssets', () => {
            const nativeSymbol = getNativeAssetSymbol(chain)
            const nativeSymbols = getNativeAssets(chain).map(a => a.symbol)
            if (chain !== 'BifrostPaseo') {
              expect(nativeSymbols).toContain(nativeSymbol)
            }
          })
        }

        it('Every native asset should have required properties', () => {
          getNativeAssets(chain).forEach(asset => {
            expect(asset).toHaveProperty('symbol')
            expect(asset).toHaveProperty('decimals')
            expect(asset).toHaveProperty('location')
            expect(asset).toHaveProperty('isNative')
            expect(asset).toHaveProperty('existentialDeposit')
          })
        })

        it('Every foreign asset should have required properties', () => {
          getOtherAssets(chain).forEach(asset => {
            expect(asset).toHaveProperty('symbol')
            expect(asset).toHaveProperty('decimals')
            expect(asset).toHaveProperty('location')
            expect(asset).toHaveProperty('existentialDeposit')
          })
        })

        it('should support its native asset via hasSupportForAsset', () => {
          const nativeSymbol = assetsObj.nativeAssetSymbol
          if (nativeSymbol && chain !== 'BifrostPaseo') {
            expect(hasSupportForAsset(chain, nativeSymbol)).toBe(true)
          }
        })
      })

      describe('isChainEvm', () => {
        it('should return boolean value', () => {
          const value = isChainEvm(chain)
          expect(value).toBeTypeOf('boolean')
        })
      })

      describe('getAssetId', () => {
        it('should return string value for every foreign asset', () => {
          const assets = getOtherAssets(chain)
          assets.forEach(asset => {
            const assetId = getAssetId(chain, asset.symbol)
            if (assetId !== null) expect(assetId).toBeTypeOf('string')
          })
        })
      })

      describe('getRelayChainSymbol', () => {
        it('should return string value', () => {
          const value = getRelayChainSymbol(chain)
          expect(['KSM', 'DOT', 'WND', 'PAS', 'ETH']).toContain(value)
          expect(value).toBeTypeOf('string')
        })
      })

      describe('getNativeAssets', () => {
        it('should return array of native assets', () => {
          const assets = getNativeAssets(chain)
          expect(assets).toBeInstanceOf(Array)
          assets.forEach(asset => {
            expect(asset).toBeTypeOf('object')
            expect(asset).toHaveProperty('symbol')
            expect(asset).toHaveProperty('location')
            expect(asset.symbol).toBeTypeOf('string')
            expect(asset).toHaveProperty('decimals')
          })
        })
      })

      describe(`getOtherAssets ${chain}`, () => {
        it('should return array of other assets', () => {
          const assets = getOtherAssets(chain)
          expect(assets).toBeInstanceOf(Array)
          assets.forEach(asset => {
            expect(asset).toBeTypeOf('object')
            expect(asset).toHaveProperty('symbol')
            expect(asset.symbol).toBeTypeOf('string')
            expect(asset).toHaveProperty('decimals')
            expect(asset).toHaveProperty('location')
          })
        })

        describe('getAssets', () => {
          it('should return array of assets', () => {
            const assets = getAssets(chain)
            expect(assets).toBeInstanceOf(Array)
            assets.forEach(asset => {
              expect(asset).toBeTypeOf('object')
              expect(asset).toHaveProperty('symbol')
              expect(asset).toHaveProperty('location')
              expect(asset.symbol).toBeTypeOf('string')
              expect(asset).toHaveProperty('decimals')
            })
          })
        })

        describe('getAllAssetsSymbols', () => {
          it('should return array of asset symbols', () => {
            const assetsSymbols = getAssets(chain).map(asset => asset.symbol)
            expect(assetsSymbols).toBeInstanceOf(Array)
            assetsSymbols.forEach(assetSymbol => {
              expect(assetSymbol).toBeTypeOf('string')
            })
          })
        })

        describe('getNativeAssetSymbol', () => {
          it('should return native asset symbol', () => {
            const symbol = getNativeAssetSymbol(chain)
            expect(symbol).toBeTypeOf('string')
          })

          if (!isExternalChain(chain)) {
            it('should return native asset symbol from native assets', () => {
              const nativeAssets = getNativeAssets(chain)
              const symbol = getNativeAssetSymbol(chain)
              // BifrostPaseo is an exception it has only vBNC in native assets
              if (chain !== 'BifrostPaseo') {
                expect(nativeAssets.map(a => a.symbol)).toContain(symbol)
              }
            })
          }
        })

        describe('hasSupportForAsset', () => {
          it('should return boolean value', () => {
            const symbol = getNativeAssetSymbol(chain)
            const value = hasSupportForAsset(chain, symbol)
            expect(value).toBeTypeOf('boolean')
          })

          it('should return true for native asset', () => {
            const symbol = getNativeAssetSymbol(chain)
            const value = hasSupportForAsset(chain, symbol)
            if (chain !== 'BifrostPaseo') {
              expect(value).toBe(true)
            }
          })

          it('should return true for non-native asset', () => {
            const otherAssets = getOtherAssets(chain)
            otherAssets.forEach(asset => {
              const value = hasSupportForAsset(chain, asset.symbol)
              expect(value).toBe(true)
            })
          })
        })

        describe('getAssetDecimals', () => {
          it('should return valid decimals for all available assets', () => {
            const assets = getAssets(chain)
            assets.forEach(asset => {
              const decimals = getAssetDecimals(chain, asset.symbol)
              expect(decimals).toBeTypeOf('number')
              expect(decimals).toBeGreaterThanOrEqual(0)
            })
          })
        })

        describe('hasDryRunSupport', () => {
          it('should return boolean value', () => {
            const value = getAssetsObject(chain).supportsDryRunApi
            expect(value).toBeTypeOf('boolean')
          })
        })

        describe('getAssetLocation', () => {
          it('should return location for foreign assets', () => {
            const otherAssets = getOtherAssets(chain)
            otherAssets.forEach(asset => {
              expect(asset.location).toBeDefined()
            })
          })
        })

        describe('getExistentialDeposit', () => {
          it('should return existential deposit for all assets', () => {
            const assets = getAssets(chain)
            assets.forEach(asset => {
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
