<br /><br />

<div align="center">
  <h1 align="center">@paraspell/sdk</h1>
  <h4 align="center"> SDK for handling XCM asset transfers across Polkadot and Kusama ecosystems. </h4>
  <p align="center">
    <a href="https://npmjs.com/package/@paraspell/sdk">
      <img alt="version" src="https://img.shields.io/npm/v/@paraspell/sdk?style=flat-square" />
    </a>
    <a href="https://npmjs.com/package/@paraspell/sdk">
      <img alt="downloads" src="https://img.shields.io/npm/dm/@paraspell/sdk?style=flat-square" />
    </a>
    <a href="https://github.com/paraspell/xcm-sdk/actions">
      <img alt="build" src="https://github.com/paraspell/xcm-sdk/actions/workflows/release.yml/badge.svg" />
    </a>
    <a href="https://snyk.io/test/github/paraspell/sdk">
      <img alt="snyk" src="https://snyk.io/test/github/paraspell/sdk/badge.svg" />
    </a>
  </p>
  <p>Currently supporting 50 Polkadot & Kusama nodes list <a href = "https://github.com/paraspell/sdk/blob/main/docs/supportedNodes.md"\>[here]</p>
  <p>SDK documentation <a href = "https://paraspell.github.io/docs/" \>[here]</p>
</div>

<br /><br />
<br /><br />
## Installation

#### Install dependencies

```bash
pnpm | npm install || yarn add @polkadot/api @polkadot/types @polkadot/api-base @polkadot/apps-config @polkadot/util
```

#### Install SDK 

```bash
pnpm | npm install || yarn add @paraspell/sdk
```

#### Importing package to your project:

Builder pattern:
```js
import { Builder } from '@paraspell/sdk'
```

Other patterns:
```js
// ESM
import * as paraspell from '@paraspell/sdk'

// CommonJS
const paraspell = require('@paraspell/sdk')
```

## Implementation

```
NOTES:
- If you wish to transfer from Parachain that uses long IDs for example Moonbeam you have to add the character 'n' the end of currencyID. Eg: .currency(42259045809535163221576417993425387648n) will mean you transfer xcDOT.
- You can now use custom ParachainIDs if you wish to test in TestNet. Just add parachainID as an additional parameter eg: .to('Basilisk', 2948)
- You can now add optional parameter useKeepAlive which will ensure, that you send more than existential deposit.
- Since v5 you can fully customize all multilocations (address, currency and destination). Instead of string parameter simply pass object with multilocation instead for more information refer to the following PR https://github.com/paraspell/xcm-tools/pull/199.
```

### Builder pattern:

##### Transfer assets from Parachain to Parachain
```ts
await Builder(/*node api - optional*/)
      .from(NODE)
      .to(NODE /*,customParaId - optional*/ | Multilocation object /*Only works for PolkadotXCM pallet*/) 
      .currency(CurrencyString| | CurrencyID | Multilocation object)
      .amount(amount)
      .address(address | Multilocation object /*If you are sending through xTokens, you need to pass the destination and address multilocation in one object (x2)*/)
      .build()
/*
EXAMPLE:
await Builder()
      .from('Basilisk')
      .to('Robonomics')
      .currency('XRT')
      .amount(1000000000000)
      .address('4FCUYBMe2sbq5KosN22emsPUydS8XUwZhJ6VUZesmouGu6qd')
      .build()
*/
```
##### Transfer assets from the Relay chain to Parachain
```ts
await Builder(/*node api - optional*/)
      .to(NODE/*,customParaId - optional*/ | Multilocation object)
      .amount(amount)
      .address(address | Multilocation object)
      .build()
/*
EXAMPLE:
await Builder()
      .to('AssetHubPolkadot')
      .amount(1000000000000)
      .address('141NGS2jjZca5Ss2Nysth2stJ6rimcnufCNHnh5ExSsftn7U')
      .build()
*/
```
##### Transfer assets from Parachain to Relay chain
```ts
await Builder(/*node api - optional*/)
      .from(NODE)
      .amount(amount)
      .address(address | Multilocation object)
      .build()
/*
EXAMPLE:
await Builder()
      .from('AssetHubPolkadot')
      .amount(1000000000000)
      .address('141NGS2jjZca5Ss2Nysth2stJ6rimcnufCNHnh5ExSsftn7U')
      .build()
*/
```
##### Use keepAlive option
```
NOTE: Custom multilocations are not available when keepALive check is used
```
```ts
await Builder(/*node api - optional*/)
      .from(NODE)
      .amount(amount)
      .address(address)
      .useKeepAlive(destinationParaAPI)
      .build()
```
##### Close HRMP channels
```ts
Builder(api)
.from(NODE)
.closeChannel()
.inbound(inbound)
.outbound(outbound)
.build()
```

##### Open HRMP channels
```ts
Builder(api)
.from(NODE)
.to(NODE)
.openChannel()
.maxSize(maxSize)
.maxMessageSize(maxMsgSize)
.build()'
```

### Function pattern:
```
NOTES:
- Since version v5 there was a breaking change introduced. You now pass single object with properties instead of parameters
- Since v5 you can fully customize all multilocations (address, currency and destination). Instead of string parameter simply pass object with multilocation instead for more information refer to the following PR https://github.com/paraspell/xcm-tools/pull/199.
- Custom multilocations are not available when keepALive check is used
```
```ts
// Transfer assets from Parachain to Parachain
await paraspell.xcmPallet.send(
    {
      api?: ApiPromise,
      origin: origin  Parachain  name  string,
      currency: CurrencyString | CurrencyID | Multilocation object /*Only works for PolkadotXCM pallet*/,
      amount: any,
      to: destination  address  string | Multilocation object,
      destination: destination  Parachain  ID | Multilocation object /*If you are sending through xTokens, you need to pass the destination and address multilocation in one object (x2)*/,
      paraIdTo?: number,
      destApiForKeepAlive?: ApiPromise
    }
)

// Transfer assets from Parachain to Relay chain
await paraspell.xcmPallet.send(
  {
    api?: ApiPromise,
    origin: origin  Parachain  name  string,
    amount: any,
    to: destination  address  string | Multilocation object,
    paraIdTo?: number,
    destApiForKeepAlive?: ApiPromise
  }
)

// Transfer assets from Relay chain to Parachain
await paraspell.xcmPallet.transferRelayToPara(
  {
    api?: ApiPromise,
    destination: destination  Parachain  ID | Multilocation object,
    amount: any,
    to: destination  address  string | Multilocation object,
    paraIdTo?: number,
    destApiForKeepAlive?: ApiPromise
  }
)

// Close HRMP channels
paraspell.closeChannels.closeChannel(
  {
    api: ApiPromise,
    origin: origin  Parachain  ID, 
    inbound: number,
    outbound: number
  }
)

// Open HRMP channels
paraspell.openChannels.openChannel(
  {
    api: ApiPromise,
    origin: origin  Parachain  ID,
    destination: destination  Parachain  ID,
    maxSize: number,
    maxMessageSize: number
  }
)
```

### Asset queries:

```ts
// Retrieve assets object from assets.json for particular node including information about native and foreign assets
paraspell.assets.getAssetsObject(node: TNode)

// Retrieve foreign assetId for a particular node and asset symbol
paraspell.assets.getAssetId(node: TNode, symbol: string)

// Retrieve the symbol of the relay chain for a particular node. Either "DOT" or "KSM"
paraspell.assets.getRelayChainSymbol(node: TNode)

// Retrieve string array of native assets symbols for particular node
paraspell.assets.getNativeAssets(node: TNode)

// Retrieve object array of foreign assets for a particular node. Each object has a symbol and assetId property
paraspell.assets.getOtherAssets(node: TNode)

// Retrieve string array of all assets symbols. (native and foreign assets are merged into a single array)
paraspell.assets.getAllAssetsSymbols(node: TNode)

// Check if a node supports a particular asset. (Both native and foreign assets are searched). Returns boolean
paraspell.assets.hasSupportForAsset(node: TNode, symbol: string)

// Get decimals for specific asset
paraspell.assets.getAssetDecimals(node: TNode, symbol: string)

// Get specific node id
paraspell.assets.getParaId(node: TNode)

// Get specific TNode from nodeID
paraspell.assets.getTNode(nodeID: number)

// Import all compatible nodes as constant
paraspell.NODE_NAMES
```

### Parachain XCM Pallet queries
```ts
import { getDefaultPallet, getSupportedPallets, SUPPORTED_PALLETS } from  '@paraspell/sdk'

//Retrieve default pallet for specific Parachain 
getDefaultPallet(node: TNode)

// Returns an array of supported pallets for a specific Parachain
getSupportedPallets(node: TNode)

// Print all pallets that are currently supported
console.log(SUPPORTED_PALLETS)
```

### Existential deposit queries
```ts
import { getExistentialDeposit } from "@paraspell/sdk";

const ed = getExistentialDeposit('Acala')
```

## 💻 Tests
- Run compilation using `pnpm compile`

- Run linter using `pnpm lint`

- Run unit tests using `pnpm test`

- Run end-to-end tests using `pnpm test:e2e`

- Update Parachain registered assets in the map using script - `pnpm updateAssets`

- Update XCM pallets in the map using script - `pnpm updatePallets`

- Update existential deposits in the map using script - `pnpm updateEds` 

- Run all core tests and checks using `pnpm runAll`

XCM SDK can be tested in [Playground](https://github.com/paraspell/xcm-tools/tree/main/apps/playground).

## License

Made with 💛 by [ParaSpell✨](https://github.com/paraspell)

Published under [MIT License](https://github.com/paraspell/sdk/blob/main/LICENSE).

## Support

<div align="center">
 <p align="center">
    <a href="https://github.com/w3f/Grants-Program/pull/1245">
      <img width="200" alt="version" src="https://user-images.githubusercontent.com/55763425/211145923-f7ee2a57-3e63-4b7d-9674-2da9db46b2ee.png" />
    </a>
    <a href="https://kusama.subsquare.io/referenda/277">
      <img width="200" alt="version" src="https://github.com/paraspell/xcm-sdk/assets/55763425/9ed74ebe-9b29-4efd-8e3e-7467ac4caed6" />
    </a>
    <a href="https://bsx.fi/">
      <img width="200" alt="version" src="https://user-images.githubusercontent.com/55763425/204865221-90d2b3cd-f2ac-48a2-a367-08722aa8e923.svg" />
    </a>
 </p>
</div>
