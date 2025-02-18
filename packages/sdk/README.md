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
  <p>Supporting every XCM Active Parachain <a href = "https://paraspell.github.io/docs/supported.html"\>[list]</p>
  <p>SDK documentation <a href = "https://paraspell.github.io/docs/" \>[here]</p>
   <p>SDK starter template project <a href = "https://github.com/paraspell/xcm-sdk-template" \>[here]</p>
</div>

<br /><br />
<br /><br />

## Installation

### Install dependencies

ParaSpell XCM SDK is the 🥇 in the ecosystem to support both **PolkadotJS** and **PolkadotAPI**.

**This version of SDK uses PolkadotAPI** if you wish to use **PolkadotJS** version please reffer to [following package](https://github.com/paraspell/xcm-tools/tree/main/packages/sdk-pjs).


```bash
#Polkadot API peer dependencies
pnpm | npm install || yarn add polkadot-api 
```

### Install SDK 

```bash
pnpm | npm install || yarn add @paraspell/sdk
```

### Importing package to your project

Builder pattern:
```js
// Polkadot API version
import { Builder } from '@paraspell/sdk'
```

Other patterns:
```js
// ESM
import * as paraspell from '@paraspell/sdk'

// CommonJS
const paraspell = require('@paraspell/sdk')
```

Interaction with further asset symbol abstraction:
```js 
import { Native, Foreign, ForeignAbstract } from '@paraspell/sdk'; //Only needed when advanced asset symbol selection is used.
```
## Implementation

```
NOTES:
- If you wish to transfer from Parachain that uses long IDs for example Moonbeam you have to add the character 'n' to the end of currencyID. Eg: .currency({id: 42259045809535163221576417993425387648n}) will mean you transfer xcDOT.
- You can now use custom ParachainIDs if you wish to test in TestNet. Just add parachainID as an additional parameter eg: .to('Basilisk', 2948).
- POLKADOT <> KUSAMA Bridge is now available! Try sending DOT or KSM between AssetHubs - More information here: https://paraspell.github.io/docs/sdk/xcmPallet.html#ecosystem-bridges.
- You can now customize XCM Version! Try using .xcmVersion parameter after address in builder.
- POLKADOT <> ETHEREUM Bridge is now available! Try sending WETH between the ecosystems - More information here: https://paraspell.github.io/docs/sdk/xcmPallet.html#ecosystem-bridges.
- ParaSpell now offers advanced asset symbol selection {symbol: "symbol"} for non duplicate assets, {symbol: Native("symbol")} or {symbol: Foreign("symbol")} if the duplicates are between native and foreign assets and {symbol: ForeignAbstract("symbol")} if the duplicates are in foreign assets only. You will get an error that will guide you further if you simply start with {symbol: "symbol"}.
- You can now select assets by multilocation by simply using { multilocation: string | JSON }. The custom multilocation selection remains supported, but in order to use it you now have to use override - {multilocation: Override('Custom Multilocation')}.
- The balance queries also support multilocation asset selection
- PAPI version of SDK is now fully PJS-less (We removed apps/config as dependency entirely).
- You can now query foreign asset minimal deposits also.
```

```
Latest news:
- Since v8, amount moved closer to currency selection and specifying from and to parameters is no longer optional to save code.
- More information on v8 major breaking change: https://github.com/paraspell/xcm-tools/pull/554
- XCM SDK Now supports API Failsafe - If one endpoint doesn't work it automatically switches to the next one.
- Builder now allows you to directly disconnect API.
```

### Builder pattern:

##### Transfer assets from Parachain to Parachain
```ts
const builder = Builder(/*node api/ws_url_string/ws_url_array - optional*/)
      .from(NODE)
      .to(NODE /*,customParaId - optional*/ | Multilocation object /*Only works for PolkadotXCM pallet*/) 
      .currency({id: currencyID, amount: amount} | {symbol: currencySymbol, amount: amount} | {symbol: Native('currencySymbol'), amount: amount} | {symbol: Foreign('currencySymbol'), amount: amount} | {symbol: ForeignAbstract('currencySymbol'), amount: amount} | {multilocation: AssetMultilocationString, amount: amount | AssetMultilocationJson, amount: amount} | {multilocation: Override('Custom Multilocation'), amount: amount} | {multiasset: {currencySelection, isFeeAsset?: true /* for example symbol: symbol or id: id, or multilocation: multilocation*/, amount: amount}})
      .address(address | Multilocation object /*If you are sending through xTokens, you need to pass the destination and address multilocation in one object (x2)*/)
      /*.xcmVersion(Version.V1/V2/V3/V4)  //Optional parameter for manual override of XCM Version used in call
        .customPallet('Pallet','pallet_function') //Optional parameter for manual override of XCM Pallet and function used in call (If they are named differently on some node but syntax stays the same). Both pallet name and function required. Pallet name must be CamelCase, function name snake_case.*/

const tx = await builder.build()

//Make sure to disconnect API after it is no longer used (eg. after transaction)
await builder.disconnect()

/*
EXAMPLE:
const builder = Builder()
  .from('Acala')
  .to('Astar')
  .currency({
    symbol: 'ACA',
    amount: '1000000000'
  })
  .address(address)

const tx = await builder.build()

//Disconnect API after TX
await builder.disconnect()
*/
```
##### Transfer assets from the Relay chain to Parachain
```ts
const builder = Builder(/*node api/ws_url_string/ws_url_array - optional*/)
      .from(RELAY_NODE) //Kusama or Polkadot
      .to(NODE/*,customParaId - optional*/ | Multilocation object)
      .currency({symbol: 'DOT', amount: amount})
      .address(address | Multilocation object)
      /*.xcmVersion(Version.V1/V2/V3/V4)  //Optional parameter for manual override of XCM Version used in call
        .customPallet('Pallet','pallet_function') //Optional parameter for manual override of XCM Pallet and function used in call (If they are named differently on some node but syntax stays the same). Both pallet name and function required. Pallet name must be CamelCase, function name snake_case.*/

const tx = await builder.build()

//Make sure to disconnect API after it is no longer used (eg. after transaction)
await builder.disconnect()

/*
EXAMPLE:
const builder = await Builder()
  .from('Polkadot')
  .to('Astar')
  .currency({
    symbol: 'DOT',
    amount: '1000000000'
  })
  .address(address)

const tx = await builder.build()

//Disconnect API after TX
await builder.disconnect()
*/
```
##### Transfer assets from Parachain to Relay chain
```ts
const builder = Builder(/*node api/ws_url_string/ws_url_array - optional*/)
      .from(NODE)
      .to(RELAY_NODE) //Kusama or Polkadot
      .currency({symbol: 'DOT', amount: amount})
      .address(address | Multilocation object)
      /*.xcmVersion(Version.V1/V2/V3/V4)  //Optional parameter for manual override of XCM Version used in call
        .customPallet('Pallet','pallet_function') //Optional parameter for manual override of XCM Pallet and function used in call (If they are named differently on some node but syntax stays the same). Both pallet name and function required. Pallet name must be CamelCase, function name snake_case.*/

const tx = await builder.build()

//Make sure to disconnect API after it is no longer used (eg. after transaction)
await builder.disconnect()

/*
EXAMPLE:
const builder = await Builder()
  .from('Astar')
  .to('Polkadot')
  .currency({
    symbol: 'DOT',
    amount: '1000000000'
  })
  .address(address)

const tx = await builder.build()

//Disconnect API after TX
await builder.disconnect()
*/
```

##### Batch calls
You can batch XCM calls and execute multiple XCM calls within one call. All three scenarios (Para->Para, Para->Relay, Relay->Para) can be used and combined.
```js
const builder = Builder(/*node api/ws_url_string/ws_url_array - optional*/)
      .from(NODE) //Ensure, that origin node is the same in all batched XCM Calls.
      .to(NODE_2) //Any compatible Parachain
      .currency({currencySelection, amount}) //Currency to transfer - options as in scenarios above
      .address(address | Multilocation object)
      .addToBatch()

      .from(NODE) //Ensure, that origin node is the same in all batched XCM Calls.
      .to(NODE_3) //Any compatible Parachain
      .currency({currencySelection, amount}) //Currency to transfer - options as in scenarios above
      .address(address | Multilocation object)
      .addToBatch()
      
const tx = await builder.buildBatch({ 
          // This settings object is optional and batch all is the default option
          mode: BatchMode.BATCH_ALL //or BatchMode.BATCH
      })

//Make sure to disconnect API after it is no longer used (eg. after transaction)
await builder.disconnect()
```

### Dry run your XCM Calls:
```ts
//Builder pattern
const result = await Builder(API /*optional*/)
        .from(NODE)
        .to(NODE_2)
        .currency({id: currencyID, amount: amount} | {symbol: currencySymbol, amount: amount} | {symbol: Native('currencySymbol'), amount: amount} | {symbol: Foreign('currencySymbol'), amount: amount} | {symbol: ForeignAbstract('currencySymbol'), amount: amount} | {multilocation: AssetMultilocationString, amount: amount | AssetMultilocationJson, amount: amount} | {multilocation: Override('Custom Multilocation'), amount: amount} | {multiasset: {currencySelection, isFeeAsset?: true /* for example symbol: symbol or id: id, or multilocation: multilocation*/, amount: amount}})
        .address(ADDRESS)
        .dryRun(SENDER_ADDRESS)

//Function pattern
getDryRun({api /*optional*/,  node, address /*sender address*/, tx /* Extrinsic object */})
```

### Asset claim:
```ts
//Claim XCM trapped assets from the selected chain
const builder = Builder(/*node api/ws_url_string/ws_url_array - optional*/)
      .claimFrom(NODE)
      .fungible(MultilocationArray (Only one multilocation allowed) [{Multilocation}])
      .account(address | Multilocation object)
      /*.xcmVersion(Version.V3) Optional parameter, by default V3. XCM Version ENUM if a different XCM version is needed (Supported V2 & V3). Requires importing Version enum.*/

const tx = await builder.build()

//Make sure to disconnect API after it is no longer used (eg. after transaction)
await builder.disconnect()
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
paraspell.assets.getTNode(nodeID: number, ecosystem: 'polkadot' || 'kusama' || 'ethereum') //When Ethereum ecosystem is selected please fill nodeID as 1 to select Ethereum.

// Import all compatible nodes as constant
paraspell.NODE_NAMES

// Get multilocation for asset id or symbol on specific chain
getAssetMultiLocation(chainFrom, { symbol: symbol } | { id: assetId })
```

### Parachain XCM Pallet queries
```ts
import { getDefaultPallet, getSupportedPallets, SUPPORTED_PALLETS } from  '@paraspell/sdk';

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

//Currency is an optional parameter. If you wish to query native asset, currency parameter is not necessary.
//Currency can be either {symbol: assetSymbol}, {id: assetId}, {multilocation: assetMultilocation}.
const ed = getExistentialDeposit(node, currency?)
```

### XCM Transfer info
```ts
import { getTransferInfo, getBalanceForeign, getBalanceNative, getOriginFeeDetails, getMaxNativeTransferableAmount, getMaxForeignTransferableAmount, getTransferableAmount } from "@paraspell/sdk";

//Get balance of foreign currency
await getBalanceForeign({address, node, currency /*- {id: currencyID} | {symbol: currencySymbol} | {symbol: Native('currencySymbol')} | {symbol: Foreign('currencySymbol')} | {symbol: ForeignAbstract('currencySymbol')} | {multilocation: AssetMultilocationString | AssetMultilocationJson}*/, api /* api/ws_url_string optional */})

//Get balance of native currency
await getBalanceNative({address, node, api /* api/ws_url_string optional */})

//Get fee information regarding XCM call
await getOriginFeeDetails({from, to, currency /*- {id: currencyID} | {symbol: currencySymbol} | {symbol: Native('currencySymbol')} | {symbol: Foreign('currencySymbol')} | {symbol: ForeignAbstract('currencySymbol')} | {multilocation: AssetMultilocationString | AssetMultilocationJson}*/, amount, originAddress, destinationAddress, ahAddress /* optional parameter when destination is Ethereum and origin is Parachain other than AssetHub*/, api /* api/ws_url_string optional */, feeMargin /* 10% by default */})

//Retrieves the asset balance for a given account on a specified node. (You do not need to specify if it is native or foreign).
await getAssetBalance({address, node, currency /*- {id: currencyID} | {symbol: currencySymbol} | {symbol: Native('currencySymbol')} | {symbol: Foreign('currencySymbol')} | {symbol: ForeignAbstract('currencySymbol')} | {multilocation: AssetMultilocationString | AssetMultilocationJson}*/, api /* api/ws_url_string optional */});

//Retrieves maximal transferable balance of chain's native asset (Balance-AssetED) (If a node has more native assets, the asset selection has to be provided. Otherwise the parameter is optional).
await getMaxNativeTransferableAmount({address, node, currency /*- {symbol: currencySymbol} */})

//Retrives maximal transferable balance of chain's foreign asset (Balance-AssetED)
await getMaxForeignTransferableAmount({address, node, currency /*- {id: currencyID} | {symbol: currencySymbol} | {symbol: Native('currencySymbol')} | {symbol: Foreign('currencySymbol')} | {symbol: ForeignAbstract('currencySymbol')} | {multilocation: AssetMultilocationString | AssetMultilocationJson}*/});

//Combines the getMaxNative and getMaxForeign transferable amount functions into one, so you don't have to specify whether you want a native or foreign asset.
await getTransferableAmount({address, node, currency /*- {id: currencyID} | {symbol: currencySymbol} | {symbol: Native('currencySymbol')} | {symbol: Foreign('currencySymbol')} | {symbol: ForeignAbstract('currencySymbol')} | {multilocation: AssetMultilocationString | AssetMultilocationJson}*/});

//Get all the information about XCM transfer
await getTransferInfo({from, to, address, destinationAddress, currency /*- {id: currencyID} | {symbol: currencySymbol} | {symbol: Native('currencySymbol')} | {symbol: Foreign('currencySymbol')} | {symbol: ForeignAbstract('currencySymbol')} | {multilocation: AssetMultilocationString | AssetMultilocationJson}*/, amount, api /* api/ws_url_string optional */})

//Get bridge and execution fee for transfer from Parachain to Ethereum. Returns as an object of 2 values
await getParaEthTransferFees(/*api - optional (Can also be WS port string or array o WS ports. Must be AssetHubPolkadot WS!)*/): [bridgeFee, executionFee]

```

## 💻 Tests
- Run compilation using `pnpm compile`

- Run linter using `pnpm lint`

- Run unit tests using `pnpm test`

- Run end-to-end tests using `pnpm test:e2e`

- Run all core tests and checks using `pnpm runAll`

XCM SDK can be tested in [Playground](https://github.com/paraspell/xcm-tools/tree/main/apps/playground).

## License

Made with 💛 by [ParaSpell✨](https://github.com/paraspell)

Published under [MIT License](https://github.com/paraspell/xcm-tools/blob/main/packages/sdk/LICENSE).

## Support

<div align="center">
 <p align="center">
      <img width="200" alt="version" src="https://user-images.githubusercontent.com/55763425/211145923-f7ee2a57-3e63-4b7d-9674-2da9db46b2ee.png" />
      <img width="200" alt="version" src="https://github.com/paraspell/xcm-sdk/assets/55763425/9ed74ebe-9b29-4efd-8e3e-7467ac4caed6" />
 </p>
</div>
