<br /><br />

<div align="center">
  <h1 align="center">@paraspell/assets</h1>
  <h4 align="center"> Pallet queries for Polkadot and Kusama Parachains. </h4>
  <p align="center">
    <a href="https://npmjs.com/package/@paraspell/assets">
      <img alt="version" src="https://img.shields.io/npm/v/@paraspell/assets?style=flat-square" />
    </a>
    <a href="https://npmjs.com/package/@paraspell/assets">
      <img alt="downloads" src="https://img.shields.io/npm/dm/@paraspell/assets?style=flat-square" />
    </a>
    <a href="https://github.com/paraspell/xcm-sdk/actions">
      <img alt="build" src="https://github.com/paraspell/xcm-sdk/actions/workflows/release.yml/badge.svg" />
    </a>
    <a href="https://snyk.io/test/github/paraspell/sdk">
      <img alt="snyk" src="https://snyk.io/test/github/paraspell/sdk/badge.svg" />
    </a>
  </p>
</div>

<br /><br />
<br /><br />

## Information

This package serves as a `core` component for both `@paraspell/sdk` and `@paraspell/sdk-pjs` and is `automatically` installed as a `dependency`. The package on its own offers functionality that can be imported separately and be used in front-end applications. It allows to retrieve asset data from compatible Parachains. Users can retrieve details like `asset decimals`, `registered assets on particular Parachain`, `check if the asset is registered on Parachain` and more.

## Implementation

### Install package

```bash
pnpm | npm install || yarn add @paraspell/assets
```

### Import functionality

To use this functionality you first have to import it in the following way.

```ts
import { getSupportedDestinations, getSupportedAssets, getFeeAssets, getAssetsObject, getAssetId, getRelayChainSymbol, getNativeAssets, getNativeAssets, getOtherAssets, getAllAssetsSymbols, hasSupportForAsset, getAssetDecimals, getParaId, getTChain, getAssetLocation, TParachain, TRelaychain, TSubstrateChain, TExternalChain, TChain, findAssetInfo, findAssetInfoOrThrow } from  '@paraspell/assets'
```


### Query assets object
This function returns `assets object` from `assets.json` for `particular Parachain` including information about `native` and `foreign` assets. Function uses [TChain](https://paraspell.github.io/docs/sdk/AssetPallet.html#import-chains-as-types) types.

```ts
getAssetsObject(TChain)
```

### Query asset ID
This function returns `assetId` for `particular Parachain` and `asset symbol`. Function uses [TChain](https://paraspell.github.io/docs/sdk/AssetPallet.html#import-chains-as-types) types.

```ts
getAssetId(TChain, ASSET_SYMBOL)
```

### Query Relay chain asset symbol
This function returns the `symbol` of the Relay chain for a particular Parachain. Either `DOT` or `KSM` or `WND` or `PAS`. Function uses [TChain](https://paraspell.github.io/docs/sdk/AssetPallet.html#import-chains-as-types) types.

```ts
getRelayChainSymbol(TChain)
```

### Query native assets
This function returns a string array of `native` assets symbols for a particular Parachain. Function uses [TChain](https://paraspell.github.io/docs/sdk/AssetPallet.html#import-chains-as-types) types.

```ts
getNativeAssets(TChain)
```

### Query foreign assets
This function returns an object array of foreign assets for a particular Parachain. Each object has a symbol and assetId property. Function uses [TChain](https://paraspell.github.io/docs/sdk/AssetPallet.html#import-chains-as-types) types.

```ts
getOtherAssets(TChain)
```

### Query all asset symbols
Function returns string array of all asset symbols for a specific Parachain. (native and foreign assets are merged into a single array). Function uses [TChain](https://paraspell.github.io/docs/sdk/AssetPallet.html#import-chains-as-types) types.

```ts
getAllAssetsSymbols(TChain)
```

### Query asset support
The function checks if Parachain supports a particular asset. (Both native and foreign assets are searched). Returns boolean. Function uses [TChain](https://paraspell.github.io/docs/sdk/AssetPallet.html#import-chains-as-types) types.

```ts
hasSupportForAsset(TChain, ASSET_SYMBOL)
```

### Query asset decimals
The function returns decimals for a specific asset. Function uses [TChain](https://paraspell.github.io/docs/sdk/AssetPallet.html#import-chains-as-types) types.

```ts
getAssetDecimals(TChain, ASSET_SYMBOL)
```

### Query Parachain ID
The function returns specific Parachain id. Function uses [TChain](https://paraspell.github.io/docs/sdk/AssetPallet.html#import-chains-as-types) types.

```ts
getParaId(TChain)
```

### Query asset data and support for specific chain I
Find out whether asset is registered on chain and return its entire parameters. If not found, returns null. Function uses [TChain](https://paraspell.github.io/docs/sdk/AssetPallet.html#import-chains-as-types) types.

```ts
findAssetInfo(TChain, ASSET_SYMBOL/*, DESTINATION?*/)
```

### Query asset data and support for specific chain II
Find out whether asset is registered on chain and return its entire parameters. If not found, returns error. Function uses [TChain](https://paraspell.github.io/docs/sdk/AssetPallet.html#import-chains-as-types) types.

```ts
findAssetInfoOrThrow(TChain, ASSET_SYMBOL/*, DESTINATION?*/)
```

### Query Parachain name
Function to get specific TChain from Parachain id.

```ts
getTChain(chainID: number, ecosystem: 'Polkadot' | 'Kusama' | 'Ethereum' | 'Paseo' | 'Westend') //When Ethereum ecosystem is selected please fill chainID as 1 to select Ethereum.
```

### Import chains as types
There are 5 options for types you can choose based on your prefference

```ts
// Export all Parachains
console.log(TParachain)

// Export all Relay chains
console.log(TRelaychain)

// Export all Substrate chains (Parachains + Relays)
console.log(TSubstrateChain)

// Export chains outside Polkadot ecosystem (Ethereum)
console.log(TExternalChain)

// Export all chains implemented in ParaSpell
console.log(TChain)
```

### Import chains as constant
There are 5 options for constants you can choose based on your prefference

```ts
// Export all Parachains
console.log(PARACHAINS)

// Export all Relay chains
console.log(RELAYCHAINS)

// Export all Substrate chains (Parachains + Relays)
console.log(SUBSTRATE_CHAINS)

// Export chains outside Polkadot ecosystem (Ethereum)
console.log(EXTERNAL_CHAINS)

// Export all chains implemented in ParaSpell
console.log(CHAINS)
```

### Convert id or symbol to location
Get location for asset id or symbol. Function uses [TChain](https://paraspell.github.io/docs/sdk/AssetPallet.html#import-chains-as-types) types.

```ts
getAssetLocation(TChain, { symbol: symbol } | { id: assetId })
```

## 💻 Tests

- Run compilation using `pnpm compile`

- Run linter using `pnpm lint`

- Run unit tests using `pnpm test`

- Update Parachain registered assets in the map using script - `pnpm updateAssets`

- Update existential deposits in the map using script - `pnpm updateEds`

Assets can be tested in [Playground](https://playground.paraspell.xyz/xcm-sdk/assets).

## Contribute to XCM Tools and earn rewards 💰

We run an open Bug Bounty Program that rewards contributors for reporting and fixing bugs in the project. More information on bug bounty can be found in the [official documentation](https://paraspell.github.io/docs/contribution.html).

## Get Support 🚑

- Contact form on our [landing page](https://paraspell.xyz/#contact-us).
- Message us on our [X](https://x.com/paraspell).
- Support channel on [telegram](https://t.me/paraspell).

## License

Made with 💛 by [ParaSpell✨](https://paraspell.xyz/)

Published under [MIT License](https://github.com/paraspell/xcm-tools/blob/main/packages/assets/LICENSE).

## Supported by

<p align="center">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://github.com/paraspell/presskit/blob/main/logos_supporters/polkadot_kusama_transparent.png">
      <source media="(prefers-color-scheme: light)" srcset="https://github.com/paraspell/presskit/blob/main/logos_supporters/polkadot_kusama_w3f_standard.png">
      <img width="750" alt="Shows a black logo in light color mode and a white one in dark color mode." src="https://github.com/paraspell/presskit/blob/main/logos_supporters/polkadot_kusama_w3f_standard.png">
    </picture>
</p>