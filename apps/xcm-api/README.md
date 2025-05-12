<br /><br />

<div align="center">
  <h1 align="center">XCM-API</h1>
  <h4 align="center">The 🥇 XCM-API in Polkadot & Kusama ecosystem.</h4>
  <h4 align="center"> Enhance the cross-chain experience of your Polkadot/Kusama decentralized application.</h4>
  <p align="center">
    <a href="https://github.com/paraspell/xcm-sdk/actions">
      <img alt="build" src="https://github.com/paraspell/xcm-tools/actions/workflows/ci.yml/badge.svg" />
    </a>
  </p>
  <p align="center"> Now live at https://api.lightspell.xyz/</p>
  <p>XCM API documentation <a href = "https://paraspell.github.io/docs/api/g-started.html" \>[here]</p>
    <p>XCM API starter template project <a href = "https://github.com/paraspell/xcm-api-template
    " \>[here]</p>
</div>

<br /><br />
<br /><br />

## Introduction

  <img width="400" alt="LightSpell logo" src="https://user-images.githubusercontent.com/55763425/251588168-4855abc3-445a-4207-9a65-e891975be62c.png">

XCM API allows you to implement all XCM SDK and XCM Router features.

**Reasons to use XCM API for interoperability integration into your application:**

- XCM API handles complex logic and you are only required to provide basic details to create calls (Junctions and other complex details are auto-filled for you)
- Offloads your server from heavy computing required to construct calls (You receive constructed message already)
- Saves you server costs (Because of the reason mentioned above)
- Package-less integration (No need to install anything)
- Simple to implement (Constructed to be as dev-friendly as possible)

**XCM API can greatly reduce application development times, save server costs and boost the ecosystem with new fresh projects**.

## Implementation

### XCM Messages

A complete guide on this section can be found in [official docs](https://paraspell.github.io/docs/api/xcmP.html).

Possible parameters:

- `from`: (required): Represents the Parachain from which the assets will be transferred.
- `to`: (required): Represents the Parachain to which the assets will be transferred. This can also be custom multilocation.
- `currency`: (required): Represents the asset being sent. It should be a string value. This can also be custom multilocation.
- `address`: (required): Specifies the address of the recipient. This can also be custom multilocation.
- `xcmVersion`: (optional): Specifies manually selected XCM version if pre-selected does not work. Format: Vx - where x = version number eg. V4.

```
NOTICE:
- API now returns you transaction hash instead of transaction instruction that needs to be parsed! Implementation is as easy as api.tx(receivedHash).
- `-hash` is now deprecated and endpoint format returned back to be without -hash. Eg. 'x-transfer' instead of 'x-transfer-hash'
```

```js
//Construct XCM call from Relay chain to Parachain (DMP)
const response = await fetch('http://localhost:3001/v2/x-transfer', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from: 'Polkadot' //Or Kusama
    to: 'Parachain', // Replace "Parachain" with destination Parachain, e.g., "Moonbeam" or custom Multilocation
    currency: {symbol: 'DOT', amount: amount}
    address: 'Address', // Replace "Address" with destination wallet address (In AccountID32 or AccountKey20 Format) or custom Multilocation
    //xcmVersion: "Vx" //Optional parameter - replace "Vx" with V and version number eg. "V4"
    //pallet: 'RandomXTokens', //Optional parameter - replace RandomXtokens with Camel case name of the pallet
	  //method: 'random_function' //Optional parameter - replace random_function with snake case name of the method
  }),
});

//Construct XCM call from Parachain chain to Relay chain (UMP)
const response = await fetch('http://localhost:3001/v2/x-transfer', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from: 'Parachain', // Replace "Parachain" with sender Parachain, e.g., "Acala"
    to: 'Polkadot' //Or Kusama
    currency: {symbol: 'DOT', amount: amount}
    address: 'Address', // Replace "Address" with destination wallet address (In AccountID32 or AccountKey20 Format) or custom Multilocation
    //xcmVersion: "Vx" //Optional parameter - replace "Vx" with V and version number eg. "V4"
    //pallet: 'RandomXTokens', //Optional parameter - replace RandomXtokens with Camel case name of the pallet
	  //method: 'random_function' //Optional parameter - replace random_function with snake case name of the method
  }),
});

//Construct XCM call from Parachain to Parachain (HRMP)
const response = await fetch('http://localhost:3001/v2/x-transfer', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from: 'Parachain', // Replace "Parachain" with sender Parachain, e.g., "Acala"
    to: 'Parachain', // Replace "Parachain" with destination Parachain, e.g., "Moonbeam" or custom Multilocation
    currency: { currencySpec }, //{id: currencyID, amount: amount} | {symbol: currencySymbol, amount: amount} | {symbol: Native('currencySymbol'), amount: amount} | {symbol: Foreign('currencySymbol'), amount: amount} | {symbol: ForeignAbstract('currencySymbol'), amount: amount} | {multilocation: AssetMultilocationString, amount: amount | AssetMultilocationJson, amount: amount} | {multilocation: Override('Custom Multilocation'), amount: amount} | {multiasset: {currencySelection, isFeeAsset?: true /* for example symbol: symbol or id: id, or multilocation: multilocation*/, amount: amount}}
    address: 'Address', // Replace "Address" with destination wallet address (In AccountID32 or AccountKey20 Format) or custom Multilocation
    //feeAsset: {id: currencyID} | {symbol: currencySymbol} | {multilocation: AssetMultilocationString | AssetMultilocationJson} //Optional parameter used when multiasset is provided or when origin is AssetHub - so user can pay in fees different than DOT
    //senderAddress: senderAddress //Optional parameter - only needed when origin is AssetHub and feeAsset is provided
    //xcmVersion: "Vx" //Optional parameter - replace "Vx" with V and version number eg. "V4"
    //pallet: 'RandomXTokens', //Optional parameter - replace RandomXtokens with Camel case name of the pallet
	  //method: 'random_function' //Optional parameter - replace random_function with snake case name of the method
  }),
});

//Construct local asset transfer
const response = await fetch('http://localhost:3001/v2/x-transfer', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from: 'Parachain', // Replace "Parachain" with sender Parachain, e.g., "Acala"
    to: 'Parachain' // Replace Parachain with same parameter as "from" parameter
    currency: { currencySpec }, //{id: currencyID, amount: amount} | {symbol: currencySymbol, amount: amount} | {symbol: Native('currencySymbol'), amount: amount} | {symbol: Foreign('currencySymbol'), amount: amount} | {symbol: ForeignAbstract('currencySymbol'), amount: amount} | {multilocation: AssetMultilocationString, amount: amount | AssetMultilocationJson, amount: amount} | {multilocation: Override('Custom Multilocation'), amount: amount} | {multiasset: {currencySelection, isFeeAsset?: true /* for example symbol: symbol or id: id, or multilocation: multilocation*/, amount: amount}}
    address: 'Address', // Replace "Address" with destination wallet address (In AccountID32 or AccountKey20 Format) or custom Multilocation
  }),
});

//Construct custom multilocation XCM call from Parachain to Parachain (HRMP)
//Multilocations can be customized for Destination, Address and Currency.
const response = await fetch('http://localhost:3001/v2/x-transfer', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from: 'Parachain', // Replace "Parachain" with sender Parachain, e.g., "Acala"
    to: 'Parachain', // Replace "Parachain" with destination Parachain, e.g., "Moonbeam" or custom Multilocation
    address: 'Address', // Replace "Address" with destination wallet address (In AccountID32 or AccountKey20 Format) or custom Multilocation
    currency: {
      multilocation: {
        parents: 0,
        interior: {
          X2: [{ PalletInstance: '50' }, { GeneralIndex: '41' }],
        },
      },
      amount: amount
    },
    //xcmVersion: "Vx" //Optional parameter - replace "Vx" with V and version number eg. "V4"
  }),
});
```

### Dry run your XCM Calls

A complete guide on asset claim can be found in [official docs](https://paraspell.github.io/docs/api/xcmP.html#dry-run).

```js
const response = await fetch('http://localhost:3001/v2/dry-run', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from: 'Parachain', // Replace "Parachain" with sender Parachain or Relay chain, e.g., "Acala"
    to: 'Parachain', // Replace "Parachain" with destination Parachain or Relay chain, e.g., "Moonbeam" or custom Multilocation
    currency: { currencySpec }, //{id: currencyID, amount: amount} | {symbol: currencySymbol, amount: amount} | {symbol: Native('currencySymbol'), amount: amount} | {symbol: Foreign('currencySymbol'), amount: amount} | {symbol: ForeignAbstract('currencySymbol'), amount: amount} | {multilocation: AssetMultilocationString, amount: amount | AssetMultilocationJson, amount: amount} | {multilocation: Override('Custom Multilocation'), amount: amount} | {multiasset: {currencySelection, isFeeAsset?: true /* for example symbol: symbol or id: id, or multilocation: multilocation*/, amount: amount}}
    address: 'Address', // Replace "Address" with destination wallet address (In AccountID32 or AccountKey20 Format) or custom Multilocation
    senderAddress: 'Address' //Replace "Address" with sender address from origin chain
  }),
```

## XCM Fee query (With DryRun)

A complete guide on asset claim can be found in [official docs](https://paraspell.github.io/docs/api/xcmP.html#xcm-fee-query-with-dryrun).

```ts
const response = await fetch("http://localhost:3001/v2/xcm-fee", {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        from: "Parachain", // Replace "Parachain" with sender Parachain, e.g., "Acala"
        to: "Parachain",   // Replace "Parachain" with destination Parachain, e.g., "Moonbeam" or custom Multilocation
        currency: {id: currencyID, amount: amount} | {symbol: currencySymbol, amount: amount} | {symbol: Native('currencySymbol'), amount: amount} | {symbol: Foreign('currencySymbol'), amount: amount} | {symbol: ForeignAbstract('currencySymbol'), amount: amount} | {multilocation: AssetMultilocationString, amount: amount | AssetMultilocationJson, amount: amount} | {multilocation: Override('Custom Multilocation'), amount: amount} | {multiasset: {currencySelection /* for example symbol: symbol or id: id, or multilocation: multilocation*/, amount: amount}}
        address: "Address" // Replace "Address" with destination wallet address (In AccountID32 or AccountKey20 Format)
        senderAddress: "Address" // Replace "Address" with sender wallet address (In AccountID32 or AccountKey20 Format) 
        //ahAddress: ahAddress //Optional parameter - used when origin is EVM node and XCM goes through AssetHub (Multihop transfer where we are unable to convert Key20 to ID32 address eg. origin: Moonbeam & destination: Ethereum (Multihop goes from Moonbeam > AssetHub > BridgeHub > Ethereum)
        /*disableFallback: "True" //Optional parameter - if enabled it disables fallback to payment info if dryrun fails only returning dryrun error but no fees.*/
    })
});
```

## XCM Fee query (Payment info)

A complete guide on asset claim can be found in [official docs](https://paraspell.github.io/docs/api/xcmP.html#xcm-fee-query-payment-info).

```ts
const response = await fetch("http://localhost:3001/v2/xcm-fee-estimate", {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        from: "Parachain", // Replace "Parachain" with sender Parachain, e.g., "Acala"
        to: "Parachain",   // Replace "Parachain" with destination Parachain, e.g., "Moonbeam" or custom Multilocation
        currency: {id: currencyID, amount: amount} | {symbol: currencySymbol, amount: amount} | {symbol: Native('currencySymbol'), amount: amount} | {symbol: Foreign('currencySymbol'), amount: amount} | {symbol: ForeignAbstract('currencySymbol'), amount: amount} | {multilocation: AssetMultilocationString, amount: amount | AssetMultilocationJson, amount: amount} | {multilocation: Override('Custom Multilocation'), amount: amount} | {multiasset: {currencySelection /* for example symbol: symbol or id: id, or multilocation: multilocation*/, amount: amount}}
        address: "Address" // Replace "Address" with destination wallet address (In AccountID32 or AccountKey20 Format)
        senderAddress: "Address" // Replace "Address" with sender wallet address (In AccountID32 or AccountKey20 Format) 
    })
});
```

### Batch call

A complete guide on asset claim can be found in [official docs](https://paraspell.github.io/docs/api/xcmP.html#batch-call).

Possible parameters: - `transfers` (Inside JSON body): (required): Represents array of XCM calls along with optional parameter "options" which contains "mode" to switch between BATCH and BATCH_ALL call forms.

```js
const response = await fetch('http://localhost:3001/v2/x-transfer-batch', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    transfers: 'Parachain', // Replace "transfers" with array of XCM transfers
  }),
});
```

### Asset claim

A complete guide on asset claim can be found in [official docs](https://paraspell.github.io/docs/api/xcmP.html#asset-claim).

Possible parameters:

- `from` (Inside JSON body): (required): Represents the Parachain on which the asset will be claimed.
- `address` (Inside JSON body): (required): Specifies the recipient's address.
- `fungible` (Inside JSON body): (required): Represents the asset being claimed. It should be a multilocation.

```js
const response = await fetch('http://localhost:3001/v2/asset-claim', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from: 'Parachain', // Replace "Parachain" with chain you wish to claim assets on
    address: 'Address', // Replace "Address" with destination wallet address (In AccountID32 or AccountKey20 Format) or custom Multilocation
    fungible: 'Asset Multilocation array', //Replace "Asset Multilocation array" with specific asset multilocation array along with the amount (example in docs)
  }),
});
```

### Transfer info query

A complete guide on this section can be found in [official docs](https://paraspell.github.io/docs/api/xcmP.html#transfer-info-query).

Possible parameters:

- `origin` (Inside JSON body): (required): Represents the Parachain from which the assets will be transferred.
- `destination` (Inside JSON body): (required): Represents the Parachain to which the assets will be transferred.
- `currency`: (Inside JSON body): (required): Represents the asset being sent. It should be a string value.
- `amount`: (Inside JSON body): (required): Specifies the amount of assets to transfer. It should be a numeric value.
- `accountOrigin`: (Inside JSON body): (required): Specifies the address of the origin.
- `accountDestination`: (Inside JSON body): (required): Specifies the recipient's address.

```js
const response = await fetch('http://localhost:3001/v2/transfer-info?', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    origin: 'Parachain', // Replace "Parachain" with chain you wish to query transfer info for as origin
    destination: 'Parachain', // Replace "Parachain" with chain you wish to query transfer info for as destination
    currency: { currencySpec }, //{id: currencyID} | {symbol: currencySymbol} | {"symbol": {"type": "Native","value": "currencySymbol"} | {"symbol": {"type": "Foreign","value": "currencySymbol"} | {"symbol": {"type": "ForeignAbstract","value": "currencySymbolAlias"} | {multilocation: AssetMultilocationString} | {multilocation: AssetMultilocationJson}
    amount: 'Amount', // Replace "Amount" with the numeric value you wish to transfer
    accountOrigin: 'Account address', // Replace "Address" with origin wallet address (In AccountID32 or AccountKey20 Format)
    accountDestination: 'Account address', // Replace "Address" with destination wallet address (In AccountID32 or AccountKey20 Format)
  }),
});
```

### XCM Router

A complete guide on this section can be found in [official docs](https://paraspell.github.io/docs/api/xcmRouter.html).

```
NOTICE:
The latest version switched to the POST method for XCM Transfers, but we kept GET method support. It will however be deprecated at some point. Please consider switching to POST method.
It is advised to use at least 120s timeout with this endpoint (Because API has to connect to other endpoints and that is time dependent)
```

Possible parameters:

- `from`: (optional): Represents the Parachain from which the assets will be transferred.
- `exchange`: (optional): Represents the Parachain DEX on which tokens will be exchanged (If not provided, DEX is selected automatically based on best price output).
- `to`: (optional): Represents the Parachain to which the assets will be transferred.
- `currencyFrom`: (required): Represents the asset being sent.
- `currencyTo`: (required): Represents the received asset.
- `amount`: (required): Specifies the amount of assets to transfer.
- `slippagePct`: (required): Specifies the slippage percentage.
- `recipientAddress`: (required): Specifies the recipient's address.
- `senderAddress`: (required): Specifies the sender's address.

```js
const response = await fetch('http://localhost:3001/v2/router', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from: 'Chain', //Origin Parachain/Relay chain - OPTIONAL PARAMETER
    exchange: 'Dex', //Exchange Parachain/Relay chain //Optional parameter, if not specified exchange will be auto-selected
    to: 'Chain', //Destination Parachain/Relay chain - OPTIONAL PARAMETER
    currencyFrom: { CurrencySpec }, // {id: currencyID, amount: amount} | {symbol: currencySymbol, amount: amount} | {symbol: Native('currencySymbol'), amount: amount} | {symbol: Foreign('currencySymbol'), amount: amount} | {symbol: ForeignAbstract('currencySymbol'), amount: amount} | {multilocation: AssetMultilocationString, amount: amount | AssetMultilocationJson, amount: amount}
    currencyTo: { CurrencySpec }, // {id: currencyID, amount: amount} | {symbol: currencySymbol, amount: amount} | {symbol: Native('currencySymbol'), amount: amount} | {symbol: Foreign('currencySymbol'), amount: amount} | {symbol: ForeignAbstract('currencySymbol'), amount: amount} | {multilocation: AssetMultilocationString, amount: amount | AssetMultilocationJson, amount: amount}
    amount: 'Amount', // Amount to send
    slippagePct: 'Pct', // Max slipppage percentage
    recipientAddress: 'Address', //Recipient address
    senderAddress: 'InjectorAddress', //Address of sender
  }),
});
```

### XCM Analyser

A complete guide on this section can be found in [official docs](https://paraspell.github.io/docs/api/xcmAnalyser.html).

```
NOTICE: Only one parameter at a time is allowed, either multilocation or xcm.
```

Possible parameters:

- `multilocation` (Optional): Specific multilocation
- `xcm` (Optional): Complete XCM call

```js
const response = await fetch('http://localhost:3001/v2/xcm-analyser', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    multilocation: 'Multilocation', //Replace Multilocation with specific Multilocation you wish to analyse
    xcm: 'XCM', //Replace XCM with the specific XCM call you wish to analyse
  }),
});
```

### SS58 Address conversion

A complete guide on this section can be found in [official docs](http://localhost:5174/docs/api/xcmP.html#ss58-address-conversion).

Possible parameters:

- `node`: Specific Parachain eg. Moonbeam
- `address`: Any SS58 Address

```js
// Retrieve Fee asset queries (Assets accepted as XCM Fee on specific node)
const response = await fetch('http://localhost:3001/v2/convert-ss58?address=:address&node=:node');
```

### Asset Pallet

A complete guide on this section can be found in [official docs](https://paraspell.github.io/docs/api/assetP.html).

Possible parameters:

- `node`: Specific Parachain eg. Moonbeam
- `asset`: Asset symbol eg. DOT
- `paraID`: Parachain ID eg. 2090 (Basilisk)

```js
// Retrieve Fee asset queries (Assets accepted as XCM Fee on specific node)
const response = await fetch('http://localhost:3001/v2/assets/:node/fee-assets');

// Retrieve assets object for a specific Parachain
const response = await fetch('http://localhost:3001/v2/assets/:node');

// Retrieve asset ID for particular Parachain and asset
const response = await fetch(
  'http://localhost:3001/v2/assets/:node/id?symbol=:asset',
);

// Retrieve the Relay chain asset Symbol for a particular Parachain
const response = await fetch(
  'http://localhost:3001/v2/assets/:node/relay-chain-symbol',
);

// Retrieve native assets for a particular Parachain
const response = await fetch('http://localhost:3001/v2/assets/:node/native');

// Retrieve foreign assets for a particular Parachain
const response = await fetch('http://localhost:3001/v2/assets/:node/other');

// Retrieve all asset symbols for particular Parachain
const response = await fetch('http://localhost:3001/v2/assets/:node/all-symbols');

// Retrieve support for a particular asset on a particular Parachain
const response = await fetch(
  'http://localhost:3001/v2/assets/:node/has-support?symbol=:asset',
);

// Retrieve decimals for a particular asset for a particular Parachain
const response = await fetch(
  'http://localhost:3001/v2/assets/:node/decimals?symbol=:asset',
);

// Retrieve Parachain ID for a particular Parachain
const response = await fetch('http://localhost:3001/v2/nodes/:node/para-id');

// Retrieve Parachain name from Parachain ID
const response = await fetch('http://localhost:3001/v2/nodes/:paraID?ecosystem=polkadot');

// Retrieve a list of implemented Parachains
const response = await fetch('http://localhost:3001/v2/nodes');

// Query list of node WS endpoints
const response = await fetch('http://localhost:3001/v2/nodes/:node/ws-endpoints');

// Query supported assets supported between two nodes
const response = await fetch('http://localhost:3001/v2/supported-assets?origin=:node&destination=:node');

// Retrieve specific asset balance for specific chain
const response = await fetch("http://localhost:3001/v2/balance/:node/asset", {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        address: "Address" // Replace "Address" with wallet address (In AccountID32 or AccountKey20 Format) 
        currency: {currencySpec}, //{id: currencyID} | {symbol: currencySymbol} | {"symbol": {"type": "Native","value": "currencySymbol"} | {"symbol": {"type": "Foreign","value": "currencySymbol"} | {"symbol": {"type": "ForeignAbstract","value": "currencySymbolAlias"} | {multilocation: AssetMultilocationString} | {multilocation: AssetMultilocationJson} | {multilocation: "type": "Override","value": "CustomAssetMultilocationJson"}
    })
});

// Retrieve max transferable amount for specific account, specific asset on specific chain
const response = await fetch("http://localhost:3001/v2/balance/:node/transferable-amount", {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        address: "Address", // Replace "Address" with wallet address (In AccountID32 or AccountKey20 Format) 
        currency: "Currency" //Replace "Currency" with {id: currencyID} | {symbol: currencySymbol} | {"symbol": {"type": "Native","value": "currencySymbol"} | {"symbol": {"type": "Foreign","value": "currencySymbol"} | {"symbol": {"type": "ForeignAbstract","value": "currencySymbolAlias"} | {multilocation: AssetMultilocationString} | {multilocation: AssetMultilocationJson}
    })
});

// Retrieve existential deposit for specific assets on selected chain
const response = await fetch("http://localhost:3001/v2/balance/:node/existential-deposit", {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        currency: "Currency" //Replace "Currency" with {id: currencyID} | {symbol: currencySymbol} | {"symbol": {"type": "Native","value": "currencySymbol"} | {"symbol": {"type": "Foreign","value": "currencySymbol"} | {"symbol": {"type": "ForeignAbstract","value": "currencySymbolAlias"} | {multilocation: AssetMultilocationString} | {multilocation: AssetMultilocationJson}
    })
});

// Retrieve multilocation for asset id or symbol for specific assets on selected chain
const response = await fetch("http://localhost:3001/v2/assets/:node/multilocation", {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        currency: "Currency" //Replace "Currency" with {id: currencyID} | {symbol: currencySymbol} | {"symbol": {"type": "Native","value": "currencySymbol"} | {"symbol": {"type": "Foreign","value": "currencySymbol"} | {"symbol": {"type": "ForeignAbstract","value": "currencySymbolAlias"}
    })
});

// Verify whether XCM message you wish to send will reach above existential deposit on destination chain.
const response = await fetch("http://localhost:3001/v2/balance/:node/foreign", {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        address: "Address", // Replace "Address" with wallet address (In AccountID32 or AccountKey20 Format) 
        currency: "Currency" //Replace "Currency" with {id: currencyID} | {symbol: currencySymbol} | {"symbol": {"type": "Native","value": "currencySymbol"} | {"symbol": {"type": "Foreign","value": "currencySymbol"} | {"symbol": {"type": "ForeignAbstract","value": "currencySymbolAlias"} | {multilocation: AssetMultilocationString} | {multilocation: AssetMultilocationJson}
    })
});
```

### XCM Pallet

A complete guide on this section can be found in [official docs](https://paraspell.github.io/docs/api/nodeP.html).

Possible parameters:

- `node`: Specific Parachain eg. Moonbeam

```js
// Return default pallet for specific Parachain
const response = await fetch('http://localhost:3001/v2/pallets/:node/default');

// Return an array of supported pallets for a specific Parachain
const response = await fetch('http://localhost:3001/v2/pallets/:node');

// Return Parachain support for DryRun
const response = await fetch('http://localhost:3001/v2/nodes/:node/has-dry-run-support');
```

## Running the API locally

### Installation

The following command installs all necessary packages.

```bash
$ pnpm install
```

### Start nest server

The following commands allow you to start the nest server locally. You can then test its endpoints with various tools (eg. [Insomnia](https://insomnia.rest/)) or integrate it directly into your application.

```bash
# development
$ pnpm start

# watch mode
$ pnpm start:dev

# production mode
$ pnpm start:prod
```

### Other

#### Upgrading request per minute count - [guide](https://paraspell.github.io/docs/api/upgrade.html).

#### Deploying API yourself - [guide](https://paraspell.github.io/docs/api/deploy.html).

## Tests

- Run linter using `pnpm lint`

- Run unit and integration tests using `pnpm test`

- Run end-to-end tests using `pnpm test:e2e`

- Run tests with coverage `pnpm test:cov`

API can be tested in [Playground](https://github.com/paraspell/xcm-tools/tree/main/apps/playground).

## License

Made with 💛 by [ParaSpell✨](https://github.com/paraspell)

Published under [MIT License](https://github.com/paraspell/xcm-tools/blob/main/apps/xcm-api/LICENSE).
