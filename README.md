# @paraspell/sdk

![Full name (3)](https://user-images.githubusercontent.com/55763425/197985791-fc7afa52-061d-413a-bbe9-bf1123f16a50.png)

[![npm version][npm-version-src]][npm-version-href]

[![npm downloads][npm-downloads-src]][npm-downloads-href]

[![Known Vulnerabilities](https://snyk.io/test/github/paraspell/sdk/badge.svg)](https://snyk.io/test/github/paraspell/sdk)

SDK For XCM & XCMP handling made with ❤️ by ParaSpell✨. It is no longer necessary to construct calls manually. @paraspell/sdk handles this for you. Feel free to become a magician and try your paraSPELLS 🧙✨.

##### Currently supporting 47 Polkadot & Kusama nodes list [here](https://github.com/paraspell/sdk/blob/main/docs/supportedNodes.md).

### Check out our brand new Wiki documentation! [Wiki docs](https://paraspell.github.io/docs/)

## Usage

**Install package:**

#### Since version 1.0.0

Our SDK introduced all Polkadot libraries as peer dependencies. The reason for this is, that most of the projects use these libraries in some way already and it fixes issues with unmet dependency warnings. Make sure your project has them. You can install them by following the command:

##### Install DEPS via npm||yarn||pnpm

```
//npm
npm install @polkadot/api @polkadot/types @polkadot/api-base @polkadot/apps-config @polkadot/util
//yarn
yarn add @polkadot/api @polkadot/types @polkadot/api-base @polkadot/apps-config @polkadot/util
//pnpm
pnpm install @polkadot/api @polkadot/types @polkadot/api-base @polkadot/apps-config @polkadot/util
```

##### Install SDK via npm||yarn||pnpm

```
//npm
npm install @paraspell/sdk
//yarn
yarn add @paraspell/sdk
//pnpm
pnpm install @paraspell/sdk
```

##### Importing package to your project:

If you wish to use XCM, HRMP and XYK Pallets only you can import Builder like this:

```js
import { Builder } from '@paraspell/sdk'
```

Old function like import (With assets):

```js
// ESM
import * as paraspell from '@paraspell/sdk'

// CommonJS
const paraspell = require('@paraspell/sdk')
```

## Currently implemented pallets

XCM pallet (Combined xTokens, polkadotXCM, ormlXTokens, XcmPallet & relayerXCM):

Builder pattern XCM & HRMP construction

```ts
//NOTE If you wish to transfer from Parachain that uses long IDs for example Moonbeam you have to add the character 'n' the end of currencyID. Eg: .currency(42259045809535163221576417993425387648n) will mean you transfer xcDOT.
//NOTE2 You can now use custom ParachainIDs if you wish to test in TestNet. Just add parachainID as an additional parameter eg: .to('Basilisk', 2948)
//NOTE3 XCM Transfer Builders now require await
//NOTE4 You can now add optional parameter useKeepAlive which will ensure, that you send more than existential deposit.
//NOTE5 API parameter in XCM messages is now optional!

//Transfer tokens from Parachain to Parachain
await Builder(/*node api - optional*/).from(NODE).to(NODE/*,customParaId - optional*/).currency(CurrencyString||CurrencyID).amount(amount).address(address).build()

//Transfer tokens from the Relay chain to Parachain
await Builder(/*node api - optional*/).to(NODE/*,customParaId - optional*/).amount(amount).address(address).build()

//Transfer tokens from Parachain to Relay chain
await Builder(/*node api - optional*/).from(NODE).amount(amount).address(address).build()

//Use keepAlive example
await Builder(/*node api - optional*/).from(NODE).amount(amount).address(address).useKeepAlive(destinationParaAPI).build()

//Close HRMP channels
Builder(api).from(NODE).closeChannel().inbound(inbound).outbound(outbound).build()

//Open HRMP channels
Builder(api).from(NODE).to(NODE).openChannel().maxSize(maxSize).maxMessageSize(maxMsgSize).build()'
```

Function pattern XCM & HRMP construction

```ts
//NOTE If you wish to transfer from Parachain that uses long IDs for example Moonbeam you have to add character 'n' the end of currencyID. Eg: currency = 42259045809535163221576417993425387648n will mean you transfer xcDOT.
//NOTE2 You can now use custom ParachainIDs if you wish to test in TestNet. Just add parachainID as an additional parameter eg: .to('Basilisk', 2948)
//NOTE3 XCM Transfer Builders now require await
//NOTE4 You can now add optional parameter useKeepAlive which will ensure, that you send more than existential deposit.
//NOTE5 API parameter in XCM messages is now optional!

//Transfer tokens from Parachain to Parachain
await paraspell.xcmPallet.send(api?: ApiPromise, origin: origin  Parachain  name  string, currency: CurrencyString||CurrencyID, amount: any, to: destination  address  string, destination: destination  Parachain  ID, paraIdTo?: number,)

//Transfer tokens from Parachain to Relay chain
await paraspell.xcmPallet.send(api?: ApiPromise, origin: origin  Parachain  name  string, amount: any, to: destination  address  string, paraIdTo?: number,)

//Transfer tokens from Relay chain to Parachain
await paraspell.xcmPallet.transferRelayToPara(api?: ApiPromise, destination: destination  Parachain  ID, amount: any, to: destination  address  string,paraIdTo?: number,)

//Use keepAlive example
await paraspell.xcmPallet.send(api?: ApiPromise, destination: TNode, amount: string | number | bigint, to: string, paraIdTo?: number, destApiForKeepAlive?: ApiPromise)

//hrmp pallet:
//Close HRMP channels
paraspell.closeChannels.closeChannel(api: ApiPromise, origin: origin  Parachain  ID, inbound: number, outbound: number)

//parasSudoWrapper pallet:
//Open HRMP channels
paraspell.openChannels.openChannel(api: ApiPromise, origin: origin  Parachain  ID, destination: destination  Parachain  ID, maxSize: number, maxMessageSize: number)
```

Asset pallet construction:

```ts
//Returns assets object from assets.json for particular node including information about native and foreign assets
paraspell.assets.getAssetsObject(node: TNode)

//Returns foreign assetId for a particular node and asset symbol
paraspell.assets.getAssetId(node: TNode, symbol: string)

//Returns the symbol of the relay chain for a particular node. Either "DOT" or "KSM"
paraspell.assets.getRelayChainSymbol(node: TNode)

//Returns string array of native assets symbols for particular node
paraspell.assets.getNativeAssets(node: TNode)

//Returns object array of foreign assets for a particular node. Each object has a symbol and assetId property
paraspell.assets.getOtherAssets(node: TNode)

//Returns string array of all assets symbols. (native and foreign assets are merged into a single array)
paraspell.assets.getAllAssetsSymbols(node: TNode)

//Checks if a node supports a particular asset. (Both native and foreign assets are searched). Returns boolean
paraspell.assets.hasSupportForAsset(node: TNode, symbol: string)

//Get decimals for specific asset
paraspell.assets.getAssetDecimals(node: TNode, symbol: string)

//Get specific node id
paraspell.assets.getParaId(node: TNode)

//Get specific TNode from nodeID
paraspell.assets.getTNode(nodeID: number)

//Import all compatible nodes as constant:
paraspell.NODE_NAMES
```

Node pallet operations

```js
import { getDefaultPallet, getSupportedPallets, SUPPORTED_PALLETS } from  '@paraspell/sdk'

//Returns default pallet for specific parachain node
getDefaultPallet(node: TNode)

//Returns an array of supported pallets for a specific parachain node.
getSupportedPallets(node: TNode)

//Prints all pallets that are currently supported
console.log(SUPPORTED_PALLETS)
```

Existential deposit query
```ts
import { getExistentialDeposit } from "@paraspell/sdk";

const ed = getExistentialDeposit('Acala')
```

##### Example of usage can be found in the UI repository [here](https://github.com/paraspell/ui) or in the Astarot repository [here](https://github.com/paraspell/astarot)

##### A list of currently compatible nodes can be found [here](https://github.com/paraspell/sdk/blob/beta-pre-release/docs/supportedNodes.md)

## 💻 Development

- Clone this repository

- Enable [Corepack](https://github.com/nodejs/corepack) using `corepack enable` (use `npm i -g corepack` for Node.js < 16.10)

- Install dependencies using `pnpm install`

- Run compilation test using `pnpm compile`

- Run linting test using `pnpm lint`

- Run updateAssets script using `pnpm updateAssets`

- Run updatePallets script using `pnpm updatePallets`

- Run tests using `pnpm test`

- Run all checks using `pnpm runAll`

## Founded by

[<img width="245" alt="web3 foundation_grants_badge_black" src="https://user-images.githubusercontent.com/55763425/211145923-f7ee2a57-3e63-4b7d-9674-2da9db46b2ee.png">](https://github.com/w3f/Grants-Program/pull/1245)

[<img width="245" alt="web3 foundation_grants_badge_white (1)" src="https://user-images.githubusercontent.com/55763425/211069914-bbec9e28-7a0d-417b-8149-087b7f04e57e.png">](https://github.com/w3f/Grants-Program/pull/1245)

[<img width="245" alt="kusamacommunity" src="https://user-images.githubusercontent.com/55763425/227636288-e0aa6f2a-9eb6-4af2-bc6b-d572f145a2f0.png">](https://kusama.subsquare.io/referenda/referendum/123)

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
