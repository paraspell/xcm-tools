
# @paraspell/sdk

  

[![npm version][npm-version-src]][npm-version-href]

[![npm downloads][npm-downloads-src]][npm-downloads-href]

[![Known Vulnerabilities](https://snyk.io/test/github/paraspell/sdk/badge.svg)](https://snyk.io/test/github/paraspell/sdk)
  

SDK For XCM & XCMP handling made with ❤️ by ParaSpell✨. It is no longer necessary to construct calls manually. @paraspell/sdk handles this for you. Feel free to become magician and try your paraSPELLS 🧙✨. 

#####  Currently supporting 59 Polkadot & Kusama nodes list [here](https://github.com/paraspell/sdk/blob/beta-pre-release/docs/supportedNodes.md). 

  

## Usage

  

Install package:

  

##### Install via npm
```
npm install @paraspell/sdk
```
##### Install via yarn
```
yarn install @paraspell/sdk
```
 ##### Install via pnpm
```
pnpm install @paraspell/sdk
```

  

 ##### Importing package to your project:

 
```js

// ESM
import  *  as  paraspell  from  '@paraspell/sdk'

// CommonJS
const paraspell = require('@paraspell/sdk')

```

  

## Currently implemented pallets

```ts

//XCM pallet (Combined xTokens, polkadotXCM, ormlXTokens, XcmPallet & relayerXCM):

//Transfer tokens from Parachain to Parachain
paraspell.xcmPallet.send(api: ApiPromise, origin: origin  Parachain  name  string, currency: currency  symbol  string, currencyID: number (If applicable), amount: any, to: destination  address  string, destination: destination  Parachain  ID)

//Transfer tokens from Parachain to Relay chain
paraspell.xcmPallet.send(api: ApiPromise, origin: origin  Parachain  name  string, currency: currency  symbol  string, currencyID: number (If applicable), amount: any, to: destination  address  string)

//Transfer tokens from Relay chain to Parachain
paraspell.xcmPallet.transferRelayToPara(api: ApiPromise, destination: destination  Parachain  ID, amount: any, to: destination  address  string)

//Transfer tokens from Relay chain to Parachain /w specific limit
paraspell.xcmPallet.limitedTransferRelayToPara(api,destParaID,amount,destinationAddress,yourWeight,true)


//hrmp pallet:

//Close HRMP channels
paraspell.closeChannels.closeChannel(api: ApiPromise, origin: origin  Parachain  ID, inbound: number, outbound: number)


//parasSudoWrapper pallet:

//Open HRMP channels
paraspell.openChannels.openChannel(api: ApiPromise, origin: origin  Parachain  ID, destination: destination  Parachain  ID, maxSize: number, maxMessageSize: number)


//Asset pallet

//Returns assets object from assets.json for particular node including information about native and foreign assets
paraspell.getAssetsObject(node: TNode)

//Returns foreign assetId for particular node and asset symbol
paraspell.getAssetId(node: TNode, symbol: string)

//Returns symbol of the relay chain for particular node. Either "DOT" or "KSM"
paraspell.getRelayChainSymbol(node: TNode)

//Returns string array of native assets symbols for particular node
paraspell.getNativeAssets(node: TNode)

//Returns object array of foreign assets for particular node. Each object has symbol and assetId property
paraspell.getOtherAssets(node: TNode)

//Returns string array of all assets symbols. (native and foreign assets are merged to a single array)
paraspell.getAllAssetsSymbols(node: TNode)

//Checks if node supports particular asset. (Both native and foreign assets are searched). Returns boolean
paraspell.hasSupportForAsset(node: TNode, symbol: string)
```

 ##### Example of usage can be found in the UI repository [here](https://github.com/paraspell/ui)
 ##### List of currently compatible nodes can be found [here](https://github.com/paraspell/sdk/blob/beta-pre-release/docs/supportedNodes.md)

  

## 💻 Development

  

- Clone this repository

- Enable [Corepack](https://github.com/nodejs/corepack) using `corepack enable` (use `npm i -g corepack` for Node.js < 16.10)

- Install dependencies using `pnpm install`

- Run interactive tests using `pnpm dev`

## Founded by
[![logo-v1](https://user-images.githubusercontent.com/55763425/204865221-90d2b3cd-f2ac-48a2-a367-08722aa8e923.svg)](https://bsx.fi/)
  


## License

Made with 💛 by [ParaSpell✨](https://github.com/paraspell)

  

Published under [MIT License](https://github.com/paraspell/sdk/blob/main/LICENSE).

  

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/@paraspell/sdk?style=flat-square

[npm-version-href]: https://npmjs.com/package/@paraspell/sdk

  

[npm-downloads-src]: https://img.shields.io/npm/dm/@paraspell/sdk?style=flat-square

[npm-downloads-href]: https://npmjs.com/package/@paraspell/sdk



[github-actions-src]: https://img.shields.io/github/workflow/status/unjs/@paraspell/sdk/ci/main?style=flat-square

[github-actions-href]: https://github.com/unjs/@paraspell/sdk/actions?query=workflow%3Aci



[codecov-src]: https://img.shields.io/codecov/c/gh/unjs/@paraspell/sdk/main?style=flat-square

[codecov-href]: https://codecov.io/gh/unjs/@paraspell/sdk
