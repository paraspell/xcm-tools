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
      <img alt="build" src="https://github.com/paraspell/xcm-tools/actions/workflows/ci.yml/badge.svg" />
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
- PAPI version of SDK is now fully PJS-less (We removed apps/config as dependency entirely).
- You can now query foreign asset minimal deposits also.
- Since v8, amount moved closer to currency selection and specifying from and to parameters is no longer optional to save code.
- More information on v8 major breaking change: https://github.com/paraspell/xcm-tools/pull/554
- XCM SDK Now supports API Failsafe - If one endpoint doesn't work it automatically switches to the next one.
- Builder now allows you to directly disconnect API.
```

```
Latest news:
- Local transfers are now available for every currency and every chain. To try them, simply use same origin and destination parameters.
```

### Builder pattern:

##### Transfer assets from Parachain to Parachain
```ts
const builder = Builder(/*node api/ws_url_string/ws_url_array - optional*/)
      .from(NODE)
      .to(NODE /*,customParaId - optional*/ | Multilocation object /*Only works for PolkadotXCM pallet*/) 
      .currency({id: currencyID, amount: amount} | {symbol: currencySymbol, amount: amount} | {symbol: Native('currencySymbol'), amount: amount} | {symbol: Foreign('currencySymbol'), amount: amount} | {symbol: ForeignAbstract('currencySymbol'), amount: amount} | {multilocation: AssetMultilocationString, amount: amount | AssetMultilocationJson, amount: amount} | {multilocation: Override('Custom Multilocation'), amount: amount} | {multiasset: {currencySelection, isFeeAsset?: true /* for example symbol: symbol or id: id, or multilocation: multilocation*/, amount: amount}})
      .address(address | Multilocation object /*If you are sending through xTokens, you need to pass the destination and address multilocation in one object (x2)*/)
      /*.senderAddress(address) - OPTIONAL - used when origin is AssetHub and feeAsset parameter is provided
        .ahAddress(ahAddress) - OPTIONAL - used when origin is EVM node and XCM goes through AssetHub (Multihop transfer where we are unable to convert Key20 to ID32 address eg. origin: Moonbeam & destination: Ethereum (Multihop goes from Moonbeam > AssetHub > BridgeHub > Ethereum)
        .feeAsset({symbol: 'symbol'} || {id: 'id'} || {multilocation: 'multilocation'}) // Optional parameter used when multiasset is provided or when origin is AssetHub - so user can pay in fees different than DOT
        .xcmVersion(Version.V1/V2/V3/V4)  //Optional parameter for manual override of XCM Version used in call
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
        .senderAddress(SENDER_ADDRESS)
        .dryRun()

//Check Parachain for DryRun support - returns true/false
import { hasDryRunSupport } from "@paraspell/sdk-pjs";

const result = hasDryRunSupport(node)
```

### XCM Fee (Origin and Dest.)
Following queries allow you to query fee from both Origin and Destination of the XCM Message. You can get accurate result from DryRun query(Requires token balance) or less accurate from Payment info query (Doesn't require token balance).

#### More accurate query using DryRun
The query is designed to retrieve you XCM fee at any cost, but fallbacking to Payment info if DryRun query fails or is not supported by either origin or destination. This query requires user to have token balance (Token that they are sending and origin native asset to pay for execution fees on origin).

```
NOTICE: When Payment info query is performed, it retrieves fees for destination in destination's native currency, however, they are paid in currency that is being sent. To solve this, you have to convert token(native) to token(transferred) based on price. DryRun returns fees in currency that is being transferred, so no additional calculations necessary in that case.
```

```ts
const fee = await Builder(/*node api/ws_url_string/ws_url_array - optional*/)
          .from(ORIGIN_CHAIN)
          .to(DESTINATION_CHAIN)
          .currency(CURRENCY)
          .address(RECIPIENT_ADDRESS)
          .senderAddress(SENDER_ADDRESS)
          .getXcmFee({disableFallback: true / false})  //When fallback is disabled, you only get notified of DryRun error, but no Payment info query fallback is performed. Payment info is still performed if Origin or Destination chain do not support DryRun out of the box.
```

#### Less accurate query using Payment info
This query is designed to retrieve you approximate fee and doesn't require any token balance.

```
NOTICE: When Payment info query is performed, it retrieves fees for destination in destination's native currency, however, they are paid in currency that is being sent. To solve this, you have to convert token(native) to token(transferred) based on price. 
```

```ts
const fee = await Builder(/*node api/ws_url_string/ws_url_array - optional*/)
          .from(ORIGIN_CHAIN)
          .to(DESTINATION_CHAIN)
          .currency(CURRENCY)
          .address(RECIPIENT_ADDRESS)
          .senderAddress(SENDER_ADDRESS) 
          .getXcmFeeEstimate()
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

### Local transfers
```ts
const builder = Builder(/*node api/ws_url_string/ws_url_array - optional*/)
      .from(NODE)
      .to(NODE) //Has to be same as origin (from)
      .currency({id: currencyID, amount: amount} | {symbol: currencySymbol, amount: amount} | {symbol: Native('currencySymbol'), amount: amount} | {symbol: Foreign('currencySymbol'), amount: amount} | {symbol: ForeignAbstract('currencySymbol'), amount: amount} | {multilocation: AssetMultilocationString, amount: amount | AssetMultilocationJson, amount: amount} | {multilocation: Override('Custom Multilocation'), amount: amount} | {multiasset: {currencySelection, isFeeAsset?: true /* for example symbol: symbol or id: id, or multilocation: multilocation*/, amount: amount}})
      .address(address)

const tx = await builder.build()

//Make sure to disconnect API after it is no longer used (eg. after transaction)
await builder.disconnect()

/*
EXAMPLE:
const builder = Builder()
  .from('Hydration')
  .to('Hydration')
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

### Asset queries:

```ts
import { getFeeAssets, getAssetsObject, getAssetId, getRelayChainSymbol, getNativeAssets, getNativeAssets, getOtherAssets, getAllAssetsSymbols, hasSupportForAsset, getAssetDecimals, getParaId, getTNode, getAssetMultiLocation, NODE_NAMES } from  '@paraspell/sdk'

// Retrieve Fee asset queries (Assets accepted as XCM Fee on specific node)
getFeeAssets(node: TNode)

// Retrieve assets object from assets.json for particular node including information about native and foreign assets
getAssetsObject(node: TNode)

// Retrieve foreign assetId for a particular node and asset symbol
getAssetId(node: TNode, symbol: string)

// Retrieve the symbol of the relay chain for a particular node. Either "DOT" or "KSM"
getRelayChainSymbol(node: TNode)

// Retrieve string array of native assets symbols for particular node
getNativeAssets(node: TNode)

// Retrieve object array of foreign assets for a particular node. Each object has a symbol and assetId property
getOtherAssets(node: TNode)

// Retrieve string array of all assets symbols. (native and foreign assets are merged into a single array)
getAllAssetsSymbols(node: TNode)

// Check if a node supports a particular asset. (Both native and foreign assets are searched). Returns boolean
hasSupportForAsset(node: TNode, symbol: string)

// Get decimals for specific asset
getAssetDecimals(node: TNode, symbol: string)

// Get specific node id
getParaId(node: TNode)

// Get specific TNode from nodeID
getTNode(nodeID: number, ecosystem: 'polkadot' || 'kusama' || 'ethereum') //When Ethereum ecosystem is selected please fill nodeID as 1 to select Ethereum.

// Import all compatible nodes as constant
NODE_NAMES

// Get multilocation for asset id or symbol on specific chain
getAssetMultiLocation(chainFrom, { symbol: symbol } | { id: assetId })
```

### Parachain XCM Pallet queries
```ts
import { getDefaultPallet, getSupportedPallets, getPalletIndex SUPPORTED_PALLETS } from  '@paraspell/sdk';

//Retrieve default pallet for specific Parachain 
getDefaultPallet(node: TNode)

// Returns an array of supported pallets for a specific Parachain
getSupportedPallets(node: TNode)

//Returns index of XCM Pallet used by Parachain
getPalletIndex(node: TNode)

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

### Convert SS58 address 
```ts
import { convertSs58 } from "@paraspell/sdk";

let result = convertSs58(address, node) // returns converted address in string
```

### XCM Transfer info
```ts
import { getAssetBalance, getTransferInfo, getOriginFeeDetails, getTransferableAmount, getParaEthTransferFees, verifyEdOnDestination } from "@paraspell/sdk";

//Get fee information regarding XCM call
await getOriginFeeDetails({from, to, currency /*- {id: currencyID} | {symbol: currencySymbol} | {symbol: Native('currencySymbol')} | {symbol: Foreign('currencySymbol')} | {symbol: ForeignAbstract('currencySymbol')} | {multilocation: AssetMultilocationString | AssetMultilocationJson}*/, amount, originAddress, destinationAddress, ahAddress /* optional parameter when destination is Ethereum and origin is Parachain other than AssetHub*/, api /* api/ws_url_string optional */, feeMargin /* 10% by default */})

//Retrieves the asset balance for a given account on a specified node. (You do not need to specify if it is native or foreign).
await getAssetBalance({address, node, currency /*- {id: currencyID} | {symbol: currencySymbol} | {symbol: Native('currencySymbol')} | {symbol: Foreign('currencySymbol')} | {symbol: ForeignAbstract('currencySymbol')} | {multilocation: AssetMultilocationString | AssetMultilocationJson}*/, api /* api/ws_url_string optional */});

//Combines the getMaxNative and getMaxForeign transferable amount functions into one, so you don't have to specify whether you want a native or foreign asset.
await getTransferableAmount({address, node, currency /*- {id: currencyID} | {symbol: currencySymbol} | {symbol: Native('currencySymbol')} | {symbol: Foreign('currencySymbol')} | {symbol: ForeignAbstract('currencySymbol')} | {multilocation: AssetMultilocationString | AssetMultilocationJson}*/});

//Get all the information about XCM transfer
await getTransferInfo({from, to, address, destinationAddress, currency /*- {id: currencyID} | {symbol: currencySymbol} | {symbol: Native('currencySymbol')} | {symbol: Foreign('currencySymbol')} | {symbol: ForeignAbstract('currencySymbol')} | {multilocation: AssetMultilocationString | AssetMultilocationJson}*/, amount, api /* api/ws_url_string optional */})

//Get bridge and execution fee for transfer from Parachain to Ethereum. Returns as an object of 2 values - [bridgeFee, executionFee]
await getParaEthTransferFees(/*api - optional (Can also be WS port string or array o WS ports. Must be AssetHubPolkadot WS!)*/)

//Verify whether XCM message you wish to send will reach above existential deposit on destination chain.
await verifyEdOnDestination(node,  currency: {symbol: || id: || multilocation: .. ,amount: 100000n}, address)
```

## 💻 Tests
- Run compilation using `pnpm compile`

- Run linter using `pnpm lint`

- Run unit tests using `pnpm test`

- Run end-to-end tests using `pnpm test:e2e`

- Run all core tests and checks using `pnpm runAll`

XCM SDK can be tested in [Playground](https://playground.paraspell.xyz/xcm-sdk/xcm-transfer).

## License

Made with 💛 by [ParaSpell✨](https://paraspell.xyz/)

Published under [MIT License](https://github.com/paraspell/xcm-tools/blob/main/packages/sdk/LICENSE).

## Support

<div align="center">
 <p align="center">
      <img width="200" alt="version" src="https://user-images.githubusercontent.com/55763425/211145923-f7ee2a57-3e63-4b7d-9674-2da9db46b2ee.png" />
      <img width="200" alt="version" src="https://github.com/paraspell/xcm-sdk/assets/55763425/9ed74ebe-9b29-4efd-8e3e-7467ac4caed6" />
 </p>
</div>
