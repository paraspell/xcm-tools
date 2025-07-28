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
import { getAssetsObject, getAssetId, getRelayChainSymbol, getNativeAssets, getNativeAssets, getOtherAssets, getAllAssetsSymbols, hasSupportForAsset, getAssetDecimals, getParaId, getTNode, getAssetMultiLocation, NODE_NAMES } from  '@paraspell/assets'
```


### Query assets object
This function returns `assets object` from `assets.json` for `particular Parachain` including information about `native` and `foreign` assets.
```ts
getAssetsObject('Acala')
```

### Query asset ID
This function returns `assetId` for `particular Parachain` and `asset symbol`
```ts
getAssetId('Acala', 'DOT')
```
### Query Relay chain asset symbol
This function returns the `symbol` of the Relay chain for a particular Parachain. Either "DOT" or "KSM"
```ts
getRelayChainSymbol('Basilisk')
```
### Query native assets
This function returns a string array of `native` assets symbols for a particular Parachain
```ts
getNativeAssets('Acala')
```
### Query foreign assets
This function returns an object array of foreign assets for a particular Parachain. Each object has a symbol and assetId property
```ts
getOtherAssets('Acala')
```
### Query all asset symbols
Function returns string array of all asset symbols for a specific Parachain. (native and foreign assets are merged into a single array)
```ts
getAllAssetsSymbols('Acala')
```
### Query asset support
The function checks if Parachain supports a particular asset. (Both native and foreign assets are searched). Returns boolean
```ts
hasSupportForAsset(node: TNode, symbol: string)
```
### Query asset decimals
The function returns decimals for a specific asset
```ts
getAssetDecimals('Basilisk', 'KSM')
```
### Query Parachain ID
The function returns specific Parachain id
```ts
getParaId('Basilisk')
```

### Query Parachain name
Function to get specific TNode from Parachain id
```ts
getTNode(nodeID: number, ecosystem: 'polkadot' || 'kusama' || 'ethereum') //When Ethereum ecosystem is selected please fill nodeID as 1 to select Ethereum.
```

### Import Parachains as constant
Import all compatible Parachains as constant
```ts
console.log(NODE_NAMES)
```

### Convert id or symbol to multilocation
Get multilocation for asset id or symbol.
```ts
getAssetMultiLocation(chainFrom, { symbol: symbol } | { id: assetId })
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

<div align="center">
 <p align="center">
      <img width="200" alt="version" src="https://user-images.githubusercontent.com/55763425/211145923-f7ee2a57-3e63-4b7d-9674-2da9db46b2ee.png" />
      <img width="200" alt="version" src="https://github.com/paraspell/xcm-sdk/assets/55763425/9ed74ebe-9b29-4efd-8e3e-7467ac4caed6" />
 </p>
</div>
