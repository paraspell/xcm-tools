<br /><br />

<div align="center">
  <h1 align="center">@paraspell/sdk-pjs</h1>
  <h4 align="center"> SDK for handling XCM asset transfers across Polkadot and Kusama ecosystems. </h4>
  <p align="center">
    <a href="https://npmjs.com/package/@paraspell/sdk-pjs">
      <img alt="version" src="https://img.shields.io/npm/v/@paraspell/sdk-pjs?style=flat-square" />
    </a>
    <a href="https://npmjs.com/package/@paraspell/sdk-pjs">
      <img alt="downloads" src="https://img.shields.io/npm/dm/@paraspell/sdk-pjs?style=flat-square" />
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
</div>

<br /><br />
<br /><br />

## Installation

### Install dependencies

ParaSpell XCM SDK is the 🥇 in the ecosystem to support both **PolkadotJS** and **PolkadotAPI**.

**This version of SDK uses PolkadotJS** if you wish to use **PolkadotAPI** version please reffer to [following package](https://github.com/paraspell/xcm-tools/tree/main/packages/sdk).


```bash
#PolkadotJS peer dependencies
pnpm | npm install || yarn add @polkadot/api @polkadot/types @polkadot/api-base @polkadot/util @polkadot/util-crypto
```

### Install SDK 

```bash
pnpm | npm install || yarn add @paraspell/sdk-pjs
```

### Importing package to your project

Builder pattern:
```ts
import { Builder } from '@paraspell/sdk-pjs'
```

Other patterns:
```ts
// ESM
import * as paraspell from '@paraspell/sdk-pjs'

// CommonJS
const paraspell = require('@paraspell/sdk-pjs')
```

Interaction with further asset symbol abstraction:
```ts 
import { Native, Foreign, ForeignAbstract } from '@paraspell/sdk-pjs'; //Only needed when advanced asset symbol selection is used. PJS version.
```

## Implementation

```
NOTES:
- Local transfers are now available for every currency and every chain. To try them, simply use the same origin and destination parameters.
- Transfer info queries are now all in the Builder pattern and don't require any imports other than the builder.
- You can now query Ethereum asset balances on Ethereum via balance query
- The Builder() now accepts an optional configuration object (To enhance localhost experience and testing). This object can contain apiOverrides and a development flag. More information in the "Localhost test setup" section.
```

```
Latest news:
- V10 > V11 Migration guide https://paraspell.github.io/docs/migration/v10-to-v11.html
- Brand new asset decimal abstraction introduced. It can be turned on in Builder config. Will be turned on by default in next major release.
```

### Sending XCM

For full documentation with examples on this feature head over to [official documentation](https://paraspell.github.io/docs/sdk/xcmPallet.html).

#### Transfer assets from Parachain to Parachain
```ts
const builder = Builder(/*chain api/builder_config/ws_url_string/ws_url_array - optional*/)
      .from(CHAIN)
      .to(CHAIN /*,customParaId - optional*/ | Location object /*Only works for PolkadotXCM pallet*/) 
      .currency({id: currencyID, amount: amount} | {symbol: currencySymbol, amount: amount} | {symbol: Native('currencySymbol'), amount: amount} | {symbol: Foreign('currencySymbol'), amount: amount} | {symbol: ForeignAbstract('currencySymbol'), amount: amount} | {location: AssetLocationString, amount: amount | AssetLocationJson, amount: amount} | {location: Override('Custom Location'), amount: amount} | [{currencySelection /*for example symbol: symbol or id: id, or location: location*/, amount: amount}, {currencySelection}, ..])
      .address(address | Location object /*If you are sending through xTokens, you need to pass the destination and address Location in one object (x2)*/)
      .senderAddress(address) // - OPTIONAL but strongly recommended as it is automatically ignored when not needed - Used when origin is AssetHub with feeAsset or when sending to AssetHub to prevent asset traps by auto-swapping to DOT to have DOT ED.
      /*.ahAddress(ahAddress) - OPTIONAL - used when origin is EVM chain and XCM goes through AssetHub (Multihop transfer where we are unable to convert Key20 to ID32 address eg. origin: Moonbeam & destination: Ethereum (Multihop goes from Moonbeam > AssetHub > BridgeHub > Ethereum)
        .feeAsset({symbol: 'symbol'} || {id: 'id'} || {location: 'location'}) // Optional parameter used when multiasset is provided or when origin is AssetHub - so user can pay in fees different than DOT
        .xcmVersion(Version.V3/V4/V5)  //Optional parameter for manual override of XCM Version used in call
        .customPallet('Pallet','pallet_function') //Optional parameter for manual override of XCM Pallet and function used in call (If they are named differently on some chain but syntax stays the same). Both pallet name and function required. Pallet name must be CamelCase, function name snake_case.*/

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
const builder = Builder(/*chain api/builder_config/ws_url_string/ws_url_array - optional*/)
      .from(RELAY_CHAIN) // Kusama | Polkadot | Westend | Paseo
      .to(CHAIN/*,customParaId - optional*/ | Location object)
      .currency({symbol: 'DOT', amount: amount})
      .address(address | Location object)
      /*.xcmVersion(Version.V3/V4/V5)  //Optional parameter for manual override of XCM Version used in call
      .customPallet('Pallet','pallet_function') //Optional parameter for manual override of XCM Pallet and function used in call (If they are named differently on some chain but syntax stays the same). Both pallet name and function required. Pallet name must be CamelCase, function name snake_case.*/

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
const builder = Builder(/*chain api/builder_config/ws_url_string/ws_url_array - optional*/)
      .from(CHAIN)
      .to(RELAY_CHAIN) // Kusama | Polkadot | Westend | Paseo
      .currency({symbol: 'DOT', amount: amount})
      .address(address | Location object)
      /*.xcmVersion(Version.V3/V4/V5)  //Optional parameter for manual override of XCM Version used in call
        .customPallet('Pallet','pallet_function') //Optional parameter for manual override of XCM Pallet and function used in call (If they are named differently on some chain but syntax stays the same). Both pallet name and function required. Pallet name must be CamelCase, function name snake_case.*/

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
const builder = Builder(/*chain api/builder_config/ws_url_string/ws_url_array - optional*/)
      .from(CHAIN)
      .to(CHAIN) //Has to be the same as the origin (from)
      .currency({id: currencyID, amount: amount} | {symbol: currencySymbol, amount: amount} | {symbol: Native('currencySymbol'), amount: amount} | {symbol: Foreign('currencySymbol'), amount: amount} | {symbol: ForeignAbstract('currencySymbol'), amount: amount} | {location: AssetLocationString, amount: amount | AssetLocationJson, amount: amount} | {location: Override('Custom Location'), amount: amount} | [{currencySelection /*for example symbol: symbol or id: id, or location: location*/, amount: amount}, {currencySelection}, ..])
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
const builder = Builder(/*chain api/builder_config/ws_url_string/ws_url_array - optional*/)
      .from(CHAIN) //Ensure, that origin chain is the same in all batched XCM Calls.
      .to(CHAIN_2) //Any compatible Parachain
      .currency({currencySelection, amount}) //Currency to transfer - options as in scenarios above
      .address(address | Location object)
      .addToBatch()

      .from(CHAIN) //Ensure, that origin chain is the same in all batched XCM Calls.
      .to(CHAIN_3) //Any compatible Parachain
      .currency({currencySelection, amount}) //Currency to transfer - options as in scenarios above
      .address(address | Location object)
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
const builder = Builder(/*chain api/builder_config/ws_url_string/ws_url_array - optional*/)
      .claimFrom(CHAIN)
      .currency({id: currencyID, amount: amount} | {symbol: currencySymbol, amount: amount} | {symbol: Native('currencySymbol'), amount: amount} | {symbol: Foreign('currencySymbol'), amount: amount} | {symbol: ForeignAbstract('currencySymbol'), amount: amount} | {location: AssetLocationString, amount: amount | AssetLocationJson, amount: amount} | [{currencySelection /*for example symbol: symbol or id: id, or location: location*/, amount: amount}, {currencySelection}, ..]
)
      .address(address | Location object)
      /*.xcmVersion(Version.V3) Optional parameter, by default chain specific version. XCM Version ENUM if a different XCM version is needed (Supported V3 & V4 & V5). Requires importing Version enum.*/

const tx = await builder.build()

//Make sure to disconnect the API after it is no longer used (eg, after a transaction)
await builder.disconnect()
```

#### Dry run your XCM Calls:
```ts
//Builder pattern
const result = await Builder(/*chain api/builder_config/ws_url_string/ws_url_array - optional*/)
        .from(CHAIN)
        .to(CHAIN_2)
        .currency({id: currencyID, amount: amount} | {symbol: currencySymbol, amount: amount} | {symbol: Native('currencySymbol'), amount: amount} | {symbol: Foreign('currencySymbol'), amount: amount} | {symbol: ForeignAbstract('currencySymbol'), amount: amount} | {location: AssetLocationString, amount: amount | AssetLocationJson, amount: amount} | {location: Override('Custom Location'), amount: amount} | {[{currencySelection, isFeeAsset?: true /* for example symbol: symbol or id: id, or Location: Location*/, amount: amount}]})
        /*.feeAsset(CURRENCY) - Optional parameter when origin === AssetHubPolkadot and TX is supposed to be paid in same fee asset as selected currency.*/
        .address(ADDRESS)
        .senderAddress(SENDER_ADDRESS)
        .dryRun()

//Check Parachain for DryRun support - returns true/false
import { hasDryRunSupport } from "@paraspell/sdk";

const result = hasDryRunSupport(chain)
```

### Localhost test setup

SDK offers enhanced localhost support. You can pass an object containing overrides for all WS endpoints (Including hops) used in the test transfer. This allows for advanced localhost testing such as localhost dry-run or xcm-fee queries. More information about available options can be found in the [official documentation](https://paraspell.github.io/docs/sdk/xcmPallet.html#localhost-testing-setup).

```ts
const builder = await Builder({
  development: true, // Optional: Enforces overrides for all chains used
  decimalAbstraction: true //Abstracts decimals, so 1 as input amount equals 10_000_000_000 if selected asset is DOT.
  apiOverrides: {
    Hydration: // "wsEndpointString" | papiClient
    BridgeHubPolkadot: // "wsEndpointString" | papiClient
    //ChainName: ...
  }
})
  .from(CHAIN)
  .to(CHAIN)
  .currency({id: currencyID, amount: amount} | {symbol: currencySymbol, amount: amount} | {symbol: Native('currencySymbol'), amount: amount} | {symbol: Foreign('currencySymbol'), amount: amount} | {symbol: ForeignAbstract('currencySymbol'), amount: amount} | {location: AssetLocationString, amount: amount | AssetLocationJson, amount: amount} | {location: Override('Custom Location'), amount: amount} | [{currencySelection, isFeeAsset?: true /* for example symbol: symbol or id: id, or Location: Location*/, amount: amount}])
  .address(address)

const tx = await builder.build()

//Disconnect API after TX
await builder.disconnect()
```

### XCM Fee queries

For full documentation with examples on this feature, head to [official documentation](https://paraspell.github.io/docs/sdk/xcmUtils.html).

#### XCM Transfer info
```ts
const info = await Builder(/*chain api/builder_config/ws_url_string/ws_url_array - optional*/)
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
const transferable = await Builder(/*chain api/builder_config/ws_url_string/ws_url_array - optional*/)
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
const ed = await Builder(/*chain api/builder_config/ws_url_string/ws_url_array - optional*/)
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
const fee = await Builder(/*chain api/builder_config/ws_url_string/ws_url_array - optional*/)
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
const fee = await Builder(/*chain api/builder_config/ws_url_string/ws_url_array - optional*/)
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
const fee = await Builder(/*chain api/builder_config/ws_url_string/ws_url_array - optional*/)
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
const fee = await Builder(/*chain api/builder_config/ws_url_string/ws_url_array - optional*/)
          .from(ORIGIN_CHAIN)
          .to(DESTINATION_CHAIN)
          .currency(CURRENCY)
          .address(RECIPIENT_ADDRESS)
          .senderAddress(SENDER_ADDRESS)          
          .getOriginXcmFeeEstimate()
```

#### Asset balance
```ts
import { getAssetBalance } from "@paraspell/sdk-pjs";

//Retrieves the asset balance for a given account on a specified chain (You do not need to specify if it is native or foreign).
const balance = await getAssetBalance({address, chain, currency /*- {id: currencyID} | {symbol: currencySymbol} | {symbol: Native('currencySymbol')} | {symbol: Foreign('currencySymbol')} | {symbol: ForeignAbstract('currencySymbol')} | {location: AssetLocationString | AssetLocationJson}*/, api /* api/ws_url_string optional */});
```

#### Ethereum bridge fees
```ts
import { getParaEthTransferFees } from "@paraspell/sdk-pjs";

const fees = await getParaEthTransferFees(/*api - optional (Can also be WS port string or array o WS ports. Must be AssetHubPolkadot WS!)*/)
```

#### Existential deposit queries
```ts
import { getExistentialDeposit } from "@paraspell/sdk-pjs";

//Currency is an optional parameter. If you wish to query native asset, currency parameter is not necessary.
//Currency can be either {symbol: assetSymbol}, {id: assetId}, {location: assetLocation}.
const ed = getExistentialDeposit(chain, currency?)
```

#### Convert SS58 address 
```ts
import { convertSs58 } from "@paraspell/sdk-pjs";

let result = convertSs58(address, chain) // returns converted address in string
```

### Asset queries:

For full documentation with examples on this feature head over to [official documentation](https://paraspell.github.io/docs/sdk/AssetPallet.html).

```ts
import { getSupportedDestinations, getFeeAssets, getAssetsObject, getAssetId, getRelayChainSymbol, getNativeAssets, getNativeAssets, getOtherAssets, getAllAssetsSymbols, hasSupportForAsset, getAssetDecimals, getParaId, getTChain, getAssetLocation, CHAINS, findAssetInfo, findAssetInfoOrThrow } from  '@paraspell/sdk-pjs'

//Get chains that support the specific asset related to origin
getSupportedDestinations(CHAIN, CURRENCY)

// Retrieve Fee asset queries (Assets accepted as XCM Fee on specific chain)
getFeeAssets(CHAIN)

// Get Location for asset ID or symbol on a  specific chain
getAssetLocation(CHAIN, { symbol: symbol } | { id: assetId })

//Find out whether asset is registered on chain and return its entire parameters. If not found, returns null.
findAssetInfo(CHAIN, CURRENCY, DESTINATION?)

//Find out whether asset is registered on chain and return its entire parameters. If not found, returns error.
findAssetInfoOrThrow(CHAIN, CURRENCY, DESTINATION?)

// Retrieve assets object from assets.json for a particular chain, including information about native and foreign assets
getAssetsObject(CHAIN)

// Retrieve foreign assetId for a particular chain and asset symbol
getAssetId(CHAIN, ASSET_SYMBOL)

// Retrieve the symbol of the relay chain for a particular chain. Either "DOT" or "KSM"
getRelayChainSymbol(CHAIN)

// Retrieve string array of native assets symbols for a  particular chain
getNativeAssets(CHAIN)

// Retrieve object array of foreign assets for a particular chain. Each object has a symbol and an  assetId property
getOtherAssets(CHAIN)

// Retrieve string array of all asset symbols. (native and foreign assets are merged into a single array)
getAllAssetsSymbols(CHAIN)

// Check if a chain supports a particular asset. (Both native and foreign assets are searched). Returns boolean
hasSupportForAsset(CHAIN, ASSET_SYMBOL)

// Get decimals for specific asset
getAssetDecimals(CHAIN, ASSET_SYMBOL)

// Get specific chain id
getParaId(CHAIN)

// Get specific TChain from chainID
getTChain(paraID: number, ecosystem: 'Polkadot' | 'Kusama' | 'Ethereum' | 'Paseo' | 'Westend') //When the Ethereum ecosystem is selected, please fill chainID as 1 to select Ethereum.

// Import all compatible chains as constant
CHAINS
```

### Parachain XCM Pallet queries

For full documentation with examples on this feature head over to [official documentation](https://paraspell.github.io/docs/sdk/NodePallets.html).

```ts
import { getDefaultPallet, getSupportedPallets, getPalletIndex, getNativeAssetsPallet, getOtherAssetsPallets, SUPPORTED_PALLETS } from  '@paraspell/sdk-pjs';

//Retrieve default pallet for specific Parachain 
getDefaultPallet(CHAIN)

// Returns an array of supported pallets for a specific Parachain
getSupportedPallets(CHAIN)

//Returns index of XCM Pallet used by Parachain
getPalletIndex(CHAIN)

//Returns all pallets for local transfers of native assets for specific chain.
getNativeAssetsPallet(chain: TChain)

//Returns all pallets for local transfers of foreign assets for specific chain.
getOtherAssetsPallets(CHAIN)

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

## Contribute to XCM Tools and earn rewards 💰

We run an open Bug Bounty Program that rewards contributors for reporting and fixing bugs in the project. More information on bug bounty can be found in the [official documentation](https://paraspell.github.io/docs/contribution.html).

## Get Support 🚑

- Contact form on our [landing page](https://paraspell.xyz/#contact-us).
- Message us on our [X](https://x.com/paraspell).
- Support channel on [telegram](https://t.me/paraspell).

## License

Made with 💛 by [ParaSpell✨](https://paraspell.xyz/)

Published under [MIT License](https://github.com/paraspell/xcm-tools/blob/main/packages/sdk/LICENSE).

## Supported by

<div align="center">
 <p align="center">
      <img width="200" alt="version" src="https://user-images.githubusercontent.com/55763425/211145923-f7ee2a57-3e63-4b7d-9674-2da9db46b2ee.png" />
      <img width="200" alt="version" src="https://github.com/paraspell/xcm-sdk/assets/55763425/9ed74ebe-9b29-4efd-8e3e-7467ac4caed6" />
 </p>
</div>
