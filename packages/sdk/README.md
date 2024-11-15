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
  <p>Currently supporting 58 Polkadot & Kusama nodes list <a href = "https://paraspell.github.io/docs/supported.html"\>[here]</p>
  <p>SDK documentation <a href = "https://paraspell.github.io/docs/" \>[here]</p>
   <p>SDK starter template project <a href = "https://github.com/paraspell/xcm-sdk-template" \>[here]</p>
</div>

<br /><br />
<br /><br />
## Installation

### Install dependencies

Install peer dependencies according to the choice of API package. 

ParaSpell XCM SDK is the 🥇 in the ecosystem to support both **PolkadotJS** and **PolkadotAPI**.

```
NOTE: Make sure to set PeerDependencyInstall flag to false on your package manager (Because it will install both API packages instead of just one)
For example on PNPM: `pnpm config set auto-install-peers false`
```

```bash
#NOTE: apps-config will soon be removed entirely from the peer dependency list

#Choose a package and install its dependencies below (SDK is built in a way, that only one library has to be installed)

#Polkadot API peer dependencies
pnpm | npm install || yarn add polkadot-api @polkadot/apps-config

#PolkadotJS peer dependencies
pnpm | npm install || yarn add @polkadot/api @polkadot/types @polkadot/api-base @polkadot/apps-config @polkadot/util
```

### Install SDK 

```bash
pnpm | npm install || yarn add @paraspell/sdk
```

### Importing package to your project

Builder pattern:
```js
// Polkadot API version
import { Builder } from '@paraspell/sdk/papi'

// Polkadot JS version
import { Builder } from '@paraspell/sdk'
```

Other patterns:
```js
// ESM PAPI
import * as paraspell from '@paraspell/sdk/papi'
// ESM PJS
import * as paraspell from '@paraspell/sdk'

// CommonJS PAPI
const paraspell = require('@paraspell/sdk/papi')

// CommonJS PJS
const paraspell = require('@paraspell/sdk')
```

Interaction with further asset symbol abstraction:
```js 
import { Native, Foreign, ForeignAbstract } from '@paraspell/sdk'; //Only needed when advanced asset symbol selection is used. PJS version.
import { Native, Foreign, ForeignAbstract } from '@paraspell/sdk/papi'; //Only needed when advanced asset symbol selection is used. PAPI version.
```
## Implementation

```
NOTES:
- If you wish to transfer from Parachain that uses long IDs for example Moonbeam you have to add the character 'n' to the end of currencyID. Eg: .currency({id: 42259045809535163221576417993425387648n}) will mean you transfer xcDOT.
- You can now use custom ParachainIDs if you wish to test in TestNet. Just add parachainID as an additional parameter eg: .to('Basilisk', 2948).
- You can now add an optional parameter useKeepAlive which will ensure, that you send more than the existential deposit.
- Since v5 you can fully customize all multilocations (address, currency and destination). Instead of a string parameter simply pass an object with multilocation instead for more information refer to the following PR https://github.com/paraspell/xcm-tools/pull/199.
- Fee asset is now a required builder parameter when you enter a multilocation array.
- When using a multilocation array the amount parameter is overridden.
- Multilocation arrays are now available. Customize your asset multilocations by .currency({multiasset: [{multilocation1},{multilocation2}..{multilocationN}]}) For more information refer to the official documentation or following PR https://github.com/paraspell/xcm-tools/pull/224.
- POLKADOT <> KUSAMA Bridge is now available! Try sending DOT or KSM between AssetHubs - More information here: https://paraspell.github.io/docs/sdk/xcmPallet.html#ecosystem-bridges.
- You can now customize XCM Version! Try using .xcmVersion parameter after address in builder.
- POLKADOT <> ETHEREUM Bridge is now available! Try sending WETH between the ecosystems - More information here: https://paraspell.github.io/docs/sdk/xcmPallet.html#ecosystem-bridges.
```

```
Latest news:
- ParaSpell now offers advanced asset symbol selection {symbol: "symbol"} for non duplicate assets, {symbol: Native("symbol")} or {symbol: Foreign("symbol")} if the duplicates are between native and foreign assets and {symbol: ForeignAbstract("symbol")} if the duplicates are in foreign assets only. You will get an error that will guide you further if you simply start with {symbol: "symbol"}.
- You can now select assets by multilocation by simply using { multilocation: string | JSON }. The custom multilocation selection remains supported, but in order to use it you now have to use override - {multilocation: Override('Custom Multilocation')}.
- The balance queries also support multilocation asset selection
```

### Builder pattern:

##### Transfer assets from Parachain to Parachain
```ts
await Builder(/*node api/ws_url_string - optional*/)
      .from(NODE)
      .to(NODE /*,customParaId - optional*/ | Multilocation object /*Only works for PolkadotXCM pallet*/) 
      .currency({id: currencyID} | {symbol: currencySymbol} | {symbol: Native('currencySymbol')} | {symbol: Foreign('currencySymbol')} | {symbol: ForeignAbstract('currencySymbol')} | {multilocation: AssetMultilocationString | AssetMultilocationJson} | {multilocation: Override('Custom Multilocation')} | {multiasset: multilocationJsonArray})
      /*.feeAsset(feeAsset) - Parameter required when using MultilocationArray*/
      .amount(amount) // Overriden when using MultilocationArray
      .address(address | Multilocation object /*If you are sending through xTokens, you need to pass the destination and address multilocation in one object (x2)*/)
      /*.xcmVersion(Version.V1/V2/V3/V4)  //Optional parameter for manual override of XCM Version used in call*/
      .build()
/*
EXAMPLE:
await Builder()
      .from('Hydration')
      .to('BifrostPolkadot')
      .currency({symbol:'BNC'})
      .amount(1000000000000)
      .address('4FCUYBMe2sbq5KosN22emsPUydS8XUwZhJ6VUZesmouGu6qd')
      .build()
*/
```
##### Transfer assets from the Relay chain to Parachain
```ts
await Builder(/*node api/ws_url_string - optional*/)
      .to(NODE/*,customParaId - optional*/ | Multilocation object)
      .amount(amount)
      .address(address | Multilocation object)
      /*.xcmVersion(Version.V1/V2/V3/V4)  //Optional parameter for manual override of XCM Version used in call*/
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
await Builder(/*node api/ws_url_string - optional*/)
      .from(NODE)
      .amount(amount)
      .address(address | Multilocation object)
      /*.xcmVersion(Version.V1/V2/V3/V4)  //Optional parameter for manual override of XCM Version used in call*/
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
await Builder(/*node api/ws_url_string - optional*/)
      .from(NODE)
      .amount(amount)
      .address(address)
      .useKeepAlive(destinationParaAPI)
      /*.xcmVersion(Version.V1/V2/V3/V4)  //Optional parameter for manual override of XCM Version used in call*/
      .build()
```

##### Batch calls
You can batch XCM calls and execute multiple XCM calls within one call. All three scenarios (Para->Para, Para->Relay, Relay->Para) can be used and combined.
```js
await Builder(/*node api/ws_url_string - optional*/)
      .from(NODE) //Ensure, that origin node is the same in all batched XCM Calls.
      .to(NODE_2) //Any compatible Parachain
      .currency(currency) //Currency to transfer (If Para->Para), otherwise you do not need to specify .currency()
      .amount(amount) 
      .address(address | Multilocation object)
      .addToBatch()

      .from(NODE) //Ensure, that origin node is the same in all batched XCM Calls.
      .to(NODE_3) //Any compatible Parachain
      .currency(currency) //Currency to transfer (If Para->Para), otherwise you do not need to specify .currency()
      .amount(amount)
      .address(address | Multilocation object)
      .addToBatch()
      .buildBatch({ 
          // This settings object is optional and batch all is the default option
          mode: BatchMode.BATCH_ALL //or BatchMode.BATCH
      })
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
      api?: ApiPromise/Ws_url_string,
      origin: origin  Parachain  name  string,
      currency: {id: currencyID} | {symbol: currencySymbol} | {symbol: Native('currencySymbol')} | {symbol: Foreign('currencySymbol')} | {symbol: ForeignAbstract('currencySymbol')} | {multilocation: AssetMultilocationString | AssetMultilocationJson} | {multilocation: Override('Custom Multilocation')} | {multiasset: multilocationJsonArray} ,
      feeAsset? - Fee asset select id
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
    api?: ApiPromise/Ws_url_string,
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
    api?: ApiPromise/Ws_url_string,
    destination: destination  Parachain  ID | Multilocation object,
    amount: any,
    to: destination  address  string | Multilocation object,
    paraIdTo?: number,
    destApiForKeepAlive?: ApiPromise
  }
)
```

### Asset claim:
```ts
//Claim XCM trapped assets from the selected chain
await Builder(api/ws_url_string)
      .claimFrom(NODE)
      .fungible(MultilocationArray (Only one multilocation allowed) [{Multilocation}])
      .account(address | Multilocation object)
      /*.xcmVersion(Version.V3) Optional parameter, by default V3. XCM Version ENUM if a different XCM version is needed (Supported V2 & V3). Requires importing Version enum.*/
      .build()
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
//PJS
import { getDefaultPallet, getSupportedPallets, SUPPORTED_PALLETS } from  '@paraspell/sdk'
//PAPI
import { getDefaultPallet, getSupportedPallets, SUPPORTED_PALLETS } from  '@paraspell/sdk/papi'

//Retrieve default pallet for specific Parachain 
getDefaultPallet(node: TNode)

// Returns an array of supported pallets for a specific Parachain
getSupportedPallets(node: TNode)

// Print all pallets that are currently supported
console.log(SUPPORTED_PALLETS)
```

### Existential deposit queries
```ts
//PJS
import { getExistentialDeposit } from "@paraspell/sdk";
//PAPI
import { getExistentialDeposit } from "@paraspell/sdk/papi";

const ed = getExistentialDeposit('Acala')
```

### XCM Transfer info
```ts
//PJS
import { getTransferInfo, getBalanceForeign, getBalanceNative, getOriginFeeDetails } from "@paraspell/sdk";
//PAPI
import { getTransferInfo, getBalanceForeign, getBalanceNative, getOriginFeeDetails } from "@paraspell/sdk/papi"; 

//Get balance of foreign currency
await getBalanceForeign({address, node, currency /*- {id: currencyID} | {symbol: currencySymbol} | {symbol: Native('currencySymbol')} | {symbol: Foreign('currencySymbol')} | {symbol: ForeignAbstract('currencySymbol')} | {multilocation: AssetMultilocationString | AssetMultilocationJson}*/, api /* api/ws_url_string optional */})

//Get balance of native currency
await getBalanceNative({address, node, api /* api/ws_url_string optional */})

//Get fee information regarding XCM call
await getOriginFeeDetails({from, to, currency /*- {id: currencyID} | {symbol: currencySymbol} | {symbol: Native('currencySymbol')} | {symbol: Foreign('currencySymbol')} | {symbol: ForeignAbstract('currencySymbol')} | {multilocation: AssetMultilocationString | AssetMultilocationJson}*/, amount, originAddress, destinationAddress, api /* api/ws_url_string optional */, feeMargin /* 10% by default */})

//Retrieves the asset balance for a given account on a specified node.
await getAssetBalance({address, node, currency /*- {id: currencyID} | {symbol: currencySymbol} | {symbol: Native('currencySymbol')} | {symbol: Foreign('currencySymbol')} | {symbol: ForeignAbstract('currencySymbol')} | {multilocation: AssetMultilocationString | AssetMultilocationJson}*/, api /* api/ws_url_string optional */});

//Get all the information about XCM transfer
await getTransferInfo({from, to, address, destinationAddress, currency /*- {id: currencyID} | {symbol: currencySymbol} | {symbol: Native('currencySymbol')} | {symbol: Foreign('currencySymbol')} | {symbol: ForeignAbstract('currencySymbol')} | {multilocation: AssetMultilocationString | AssetMultilocationJson}*/, amount, api /* api/ws_url_string optional */})
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

Published under [MIT License](https://github.com/paraspell/xcm-tools/blob/main/packages/sdk/LICENSE).

## Support

<div align="center">
 <p align="center">
    <a href="https://github.com/w3f/Grants-Program/pull/1245">
      <img width="200" alt="version" src="https://user-images.githubusercontent.com/55763425/211145923-f7ee2a57-3e63-4b7d-9674-2da9db46b2ee.png" />
    </a>
    <a href="https://kusama.subsquare.io/referenda/417">
      <img width="200" alt="version" src="https://github.com/paraspell/xcm-sdk/assets/55763425/9ed74ebe-9b29-4efd-8e3e-7467ac4caed6" />
    </a>
 </p>
</div>
