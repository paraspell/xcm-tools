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
```ts
// Polkadot API version
import { Builder } from '@paraspell/sdk'
```

Other patterns:
```ts
// ESM
import * as paraspell from '@paraspell/sdk'

// CommonJS
const paraspell = require('@paraspell/sdk')
```

Interaction with further asset symbol abstraction:
```ts 
import { Native, Foreign, ForeignAbstract } from '@paraspell/sdk'; //Only needed when advanced asset symbol selection is used.
```
## Implementation

```
NOTES:
- Local transfers are now available for every currency and every chain. To try them, simply use the same origin and destination parameters.
```

```
Latest news:
- Transfer info queries are now all in the Builder pattern and don't require any imports other than the builder.
- You can now query Ethereum asset balances on Ethereum via balance query
```

### Sending XCM:

For full documentation with examples on this feature head over to [official documentation](https://paraspell.github.io/docs/sdk/xcmPallet.html).

#### Transfer assets from Parachain to Parachain
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

//Make sure to disconnect the API after it is no longer used (eg, after a transaction)
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
#### Transfer assets from the Relay chain to the Parachain
```ts
const builder = Builder(/*node api/ws_url_string/ws_url_array - optional*/)
      .from(RELAY_NODE) //Kusama or Polkadot
      .to(NODE/*,customParaId - optional*/ | Multilocation object)
      .currency({symbol: 'DOT', amount: amount})
      .address(address | Multilocation object)
      /*.xcmVersion(Version.V1/V2/V3/V4)  //Optional parameter for manual override of XCM Version used in call
      .customPallet('Pallet','pallet_function') //Optional parameter for manual override of XCM Pallet and function used in call (If they are named differently on some node but syntax stays the same). Both pallet name and function required. Pallet name must be CamelCase, function name snake_case.*/

const tx = await builder.build()

//Make sure to disconnect the API after it is no longer used (eg, after a transaction)
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
#### Transfer assets from Parachain to Relay chain
```ts
const builder = Builder(/*node api/ws_url_string/ws_url_array - optional*/)
      .from(NODE)
      .to(RELAY_NODE) //Kusama or Polkadot
      .currency({symbol: 'DOT', amount: amount})
      .address(address | Multilocation object)
      /*.xcmVersion(Version.V1/V2/V3/V4)  //Optional parameter for manual override of XCM Version used in call
        .customPallet('Pallet','pallet_function') //Optional parameter for manual override of XCM Pallet and function used in call (If they are named differently on some node but syntax stays the same). Both pallet name and function required. Pallet name must be CamelCase, function name snake_case.*/

const tx = await builder.build()

//Make sure to disconnect the API after it is no longer used (eg, after a transaction)
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

#### Local transfers
```ts
const builder = Builder(/*node api/ws_url_string/ws_url_array - optional*/)
      .from(NODE)
      .to(NODE) //Has to be the same as the origin (from)
      .currency({id: currencyID, amount: amount} | {symbol: currencySymbol, amount: amount} | {symbol: Native('currencySymbol'), amount: amount} | {symbol: Foreign('currencySymbol'), amount: amount} | {symbol: ForeignAbstract('currencySymbol'), amount: amount} | {multilocation: AssetMultilocationString, amount: amount | AssetMultilocationJson, amount: amount} | {multilocation: Override('Custom Multilocation'), amount: amount} | {multiasset: {currencySelection, isFeeAsset?: true /* for example symbol: symbol or id: id, or multilocation: multilocation*/, amount: amount}})
      .address(address)

const tx = await builder.build()

//Make sure to disconnect the API after it is no longer used (eg, after a transaction)
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

#### Batch calls
```ts
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

//Make sure to disconnect the API after it is no longer used (eg, after a transaction)
await builder.disconnect()
```

#### Asset claim:
```ts
//Claim XCM trapped assets from the selected chain
const builder = Builder(/*node api/ws_url_string/ws_url_array - optional*/)
      .claimFrom(NODE)
      .fungible(MultilocationArray (Only one multilocation allowed) [{Multilocation}])
      .account(address | Multilocation object)
      /*.xcmVersion(Version.V3) Optional parameter, by default V3. XCM Version ENUM if a different XCM version is needed (Supported V2 & V3). Requires importing Version enum.*/

const tx = await builder.build()

//Make sure to disconnect the API after it is no longer used (eg, after a transaction)
await builder.disconnect()
```

#### Dry run your XCM Calls:
```ts
//Builder pattern
const result = await Builder(API /*optional*/)
        .from(NODE)
        .to(NODE_2)
        .currency({id: currencyID, amount: amount} | {symbol: currencySymbol, amount: amount} | {symbol: Native('currencySymbol'), amount: amount} | {symbol: Foreign('currencySymbol'), amount: amount} | {symbol: ForeignAbstract('currencySymbol'), amount: amount} | {multilocation: AssetMultilocationString, amount: amount | AssetMultilocationJson, amount: amount} | {multilocation: Override('Custom Multilocation'), amount: amount} | {multiasset: {currencySelection, isFeeAsset?: true /* for example symbol: symbol or id: id, or multilocation: multilocation*/, amount: amount}})
        /*.feeAsset(CURRENCY) - Optional parameter when origin === AssetHubPolkadot and TX is supposed to be paid in same fee asset as selected currency.*/
        .address(ADDRESS)
        .senderAddress(SENDER_ADDRESS)
        .dryRun()

//Check Parachain for DryRun support - returns true/false
import { hasDryRunSupport } from "@paraspell/sdk-pjs";

const result = hasDryRunSupport(node)
```

### XCM Fee queries

For full documentation with examples on this feature, head to [official documentation](https://paraspell.github.io/docs/sdk/xcmUtils.html).

#### XCM Transfer info
```ts
const info = await Builder(/*node api/ws_url_string/ws_url_array - optional*/)
          .from(ORIGIN_CHAIN)
          .to(DESTINATION_CHAIN)
          .currency(CURRENCY)
          /*.feeAsset(CURRENCY) - Optional parameter when origin === AssetHubPolkadot and TX is supposed to be paid in the same fee asset as selected currency.*/
          .address(RECIPIENT_ADDRESS)
          .senderAddress(SENDER_ADDRESS)
          .getTransferInfo()
```

#### Transferable amount
```ts
const transferable = await Builder(/*node api/ws_url_string/ws_url_array - optional*/)
          .from(ORIGIN_CHAIN)
          .to(DESTINATION_CHAIN)
          .currency(CURRENCY)
          /*.feeAsset(CURRENCY) - Optional parameter when origin === AssetHubPolkadot and TX is supposed to be paid in the same fee asset as selected currency.*/
          .address(RECIPIENT_ADDRESS)
          .senderAddress(SENDER_ADDRESS)
          .getTransferableAmount()
```

#### Verify ED on destination
```ts
const ed = await Builder(/*node api/ws_url_string/ws_url_array - optional*/)
          .from(ORIGIN_CHAIN)
          .to(DESTINATION_CHAIN)
          .currency(CURRENCY)
          /*.feeAsset(CURRENCY) - Optional parameter when origin === AssetHubPolkadot and TX is supposed to be paid in the same fee asset as selected currency.*/
          .address(RECIPIENT_ADDRESS)
          .senderAddress(SENDER_ADDRESS)
          .verifyEdOnDestination()
```

#### XCM Fee (Origin and Dest.)

##### More accurate query using DryRun
```ts
const fee = await Builder(/*node api/ws_url_string/ws_url_array - optional*/)
          .from(ORIGIN_CHAIN)
          .to(DESTINATION_CHAIN)
          .currency(CURRENCY)
          /*.feeAsset(CURRENCY) - Optional parameter when origin === AssetHubPolkadot and TX is supposed to be paid in the same fee asset as selected currency.*/
          .address(RECIPIENT_ADDRESS)
          .senderAddress(SENDER_ADDRESS)
          .getXcmFee(/*{disableFallback: true / false}*/)  //Fallback is optional. When fallback is disabled, you only get notified of a DryRun error, but no Payment info query fallback is performed. Payment info is still performed if Origin or Destination chain do not support DryRun out of the box.
```

##### Less accurate query using Payment info
```ts
const fee = await Builder(/*node api/ws_url_string/ws_url_array - optional*/)
          .from(ORIGIN_CHAIN)
          .to(DESTINATION_CHAIN)
          .currency(CURRENCY)
          .address(RECIPIENT_ADDRESS)
          .senderAddress(SENDER_ADDRESS)          
          .getXcmFeeEstimate()
```

#### XCM Fee (Origin only)

##### More accurate query using DryRun
```ts
const fee = await Builder(/*node api/ws_url_string/ws_url_array - optional*/)
          .from(ORIGIN_CHAIN)
          .to(DESTINATION_CHAIN)
          .currency(CURRENCY)
          /*.feeAsset(CURRENCY) - Optional parameter when origin === AssetHubPolkadot and TX is supposed to be paid in the same fee asset as selected currency.*/
          .address(RECIPIENT_ADDRESS)
          .senderAddress(SENDER_ADDRESS)
          .getOriginXcmFee(/*{disableFallback: true / false}*/)  //Fallback is optional. When fallback is disabled, you only get notified of a DryRun error, but no Payment info query fallback is performed. Payment info is still performed if Origin do not support DryRun out of the box.
```

##### Less accurate query using Payment info
```ts
const fee = await Builder(/*node api/ws_url_string/ws_url_array - optional*/)
          .from(ORIGIN_CHAIN)
          .to(DESTINATION_CHAIN)
          .currency(CURRENCY)
          .address(RECIPIENT_ADDRESS)
          .senderAddress(SENDER_ADDRESS)          
          .getOriginXcmFeeEstimate()
```

#### Asset balance
```ts
import { getAssetBalance } from "@paraspell/sdk";

//Retrieves the asset balance for a given account on a specified node (You do not need to specify if it is native or foreign).
const balance = await getAssetBalance({address, node, currency /*- {id: currencyID} | {symbol: currencySymbol} | {symbol: Native('currencySymbol')} | {symbol: Foreign('currencySymbol')} | {symbol: ForeignAbstract('currencySymbol')} | {multilocation: AssetMultilocationString | AssetMultilocationJson}*/, api /* api/ws_url_string optional */});
```

#### Ethereum bridge fees
```ts
import { getParaEthTransferFees } from "@paraspell/sdk";

const fees = await getParaEthTransferFees(/*api - optional (Can also be WS port string or array o WS ports. Must be AssetHubPolkadot WS!)*/)
```

#### Existential deposit queries
```ts
import { getExistentialDeposit } from "@paraspell/sdk";

//Currency is an optional parameter. If you wish to query a native asset, the currency parameter is not necessary.
//Currency can be either {symbol: assetSymbol}, {id: assetId}, {multilocation: assetMultilocation}.
const ed = getExistentialDeposit(node, currency?)
```

#### Convert SS58 address 
```ts
import { convertSs58 } from "@paraspell/sdk";

let result = convertSs58(address, node) // returns converted address in string
```

### Asset queries:

For full documentation with examples on this feature, head over to [official documentation](https://paraspell.github.io/docs/sdk/AssetPallet.html).

```ts
import { getFeeAssets, getAssetsObject, getAssetId, getRelayChainSymbol, getNativeAssets, getNativeAssets, getOtherAssets, getAllAssetsSymbols, hasSupportForAsset, getAssetDecimals, getParaId, getTNode, getAssetMultiLocation, NODE_NAMES } from  '@paraspell/sdk'

// Retrieve Fee asset queries (Assets accepted as XCM Fee on specific node)
getFeeAssets(NODE)

// Get multilocation for asset ID or symbol on a  specific chain
getAssetMultiLocation(NODE, { symbol: symbol } | { id: assetId })

// Retrieve assets object from assets.json for a particular node, including information about native and foreign assets
getAssetsObject(NODE)

// Retrieve foreign assetId for a particular node and asset symbol
getAssetId(NODE, ASSET_SYMBOL)

// Retrieve the symbol of the relay chain for a particular node. Either "DOT" or "KSM"
getRelayChainSymbol(NODE)

// Retrieve string array of native assets symbols for a  particular node
getNativeAssets(NODE)

// Retrieve object array of foreign assets for a particular node. Each object has a symbol and an  assetId property
getOtherAssets(NODE)

// Retrieve string array of all asset symbols. (native and foreign assets are merged into a single array)
getAllAssetsSymbols(NODE)

// Check if a node supports a particular asset. (Both native and foreign assets are searched). Returns boolean
hasSupportForAsset(NODE, ASSET_SYMBOL)

// Get decimals for specific asset
getAssetDecimals(NODE, ASSET_SYMBOL)

// Get specific node id
getParaId(NODE)

// Get specific TNode from nodeID
getTNode(paraID: number, ecosystem: 'polkadot' || 'kusama' || 'ethereum') //When the Ethereum ecosystem is selected, please fill nodeID as 1 to select Ethereum.

// Import all compatible nodes as constant
NODE_NAMES
```

### Parachain XCM Pallet queries

For full documentation with examples on this feature head over to [official documentation](https://paraspell.github.io/docs/sdk/NodePallets.html).

```ts
import { getDefaultPallet, getSupportedPallets, getPalletIndex SUPPORTED_PALLETS } from  '@paraspell/sdk';

//Retrieve default pallet for specific Parachain 
getDefaultPallet(NODE)

// Returns an array of supported pallets for a specific Parachain
getSupportedPallets(NODE)

//Returns index of XCM Pallet used by Parachain
getPalletIndex(NODE)

// Print all pallets that are currently supported
console.log(SUPPORTED_PALLETS)
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