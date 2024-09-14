<br /><br />

<div align="center">
  <h1 align="center">XCM-API</h1>
  <h4 align="center">The 🥇 XCM-API in Polkadot & Kusama ecosystem.</h4>
  <h4 align="center"> Enhance the cross-chain experience of your Polkadot/Kusama decentralized application.</h4>
  <p align="center">
    <a href="https://github.com/paraspell/xcm-sdk/actions">
      <img alt="build" src="https://github.com/paraspell/xcm-api/actions/workflows/ci.yml/badge.svg" />
    </a>
  </p>
  <p align="center"> Now live at https://api.lightspell.xyz/</p>
  <p>XCM API documentation <a href = "https://paraspell.github.io/docs/api/g-started.html" \>[here]</p>
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

- `from`: (optional): Represents the Parachain from which the assets will be transferred.
- `to`: (optional): Represents the Parachain to which the assets will be transferred. This can also be custom multilocation.
- `currency`: (optional): Represents the asset being sent. It should be a string value. This can also be custom multilocation.
- `amount`: (required): Specifies the amount of assets to transfer. It should be a numeric value.
- `address`: (required): Specifies the address of the recipient. This can also be custom multilocation.
- `xcmVersion`: (optional): Specifies manually selected XCM version if pre-selected does not work. Format: Vx - where x = version number eg. V4.

```
NOTICE:
- The latest version switched to the POST method for XCM Transfers, but we kept GET method support. It will however be deprecated at some point. Please consider switching to POST method.
- API now returns you transaction hash instead of transaction instruction that needs to be parsed! Implementation is as easy as api.tx(receivedHash).
```

```js
//Construct XCM call from Relay chain to Parachain (DMP)
const response = await fetch('http://localhost:3001/x-transfer-hash', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    to: 'Parachain', // Replace "Parachain" with destination Parachain, e.g., "Moonbeam" or custom Multilocation
    amount: 'Amount', // Replace "Amount" with the numeric value you wish to transfer
    address: 'Address', // Replace "Address" with destination wallet address (In AccountID32 or AccountKey20 Format) or custom Multilocation
    //xcmVersion: "Vx" //Optional parameter - replace "Vx" with V and version number eg. "V4"
  }),
});

//Construct XCM call from Parachain chain to Relay chain (UMP)
const response = await fetch('http://localhost:3001/x-transfer-hash', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from: 'Parachain', // Replace "Parachain" with sender Parachain, e.g., "Acala"
    amount: 'Amount', // Replace "Amount" with the numeric value you wish to transfer
    address: 'Address', // Replace "Address" with destination wallet address (In AccountID32 or AccountKey20 Format) or custom Multilocation
    //xcmVersion: "Vx" //Optional parameter - replace "Vx" with V and version number eg. "V4"
  }),
});

//Construct XCM call from Parachain to Parachain (HRMP)
const response = await fetch('http://localhost:3001/x-transfer-hash', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from: 'Parachain', // Replace "Parachain" with sender Parachain, e.g., "Acala"
    to: 'Parachain', // Replace "Parachain" with destination Parachain, e.g., "Moonbeam" or custom Multilocation
    currency: {currencySpec}, // {id: currencyID} | {symbol: currencySymbol}, | {multilocation: multilocationJson} | {multiasset: multilocationJsonArray}
    amount: 'Amount', // Replace "Amount" with the numeric value you wish to transfer
    address: 'Address', // Replace "Address" with destination wallet address (In AccountID32 or AccountKey20 Format) or custom Multilocation
    //xcmVersion: "Vx" //Optional parameter - replace "Vx" with V and version number eg. "V4"
  }),
});

//Construct custom multilocation XCM call from Parachain to Parachain (HRMP)
//Multilocations can be customized for Destination, Address and Currency.
const response = await fetch('http://localhost:3001/x-transfer-hash', {
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
      }
    },
    amount: 'Amount', // Replace "Amount" with the numeric value you wish to transfer
    //xcmVersion: "Vx" //Optional parameter - replace "Vx" with V and version number eg. "V4"
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
const response = await fetch('http://localhost:3001/asset-claim-hash', {
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
const response = await fetch(
  'http://localhost:3001/transfer-info?' , {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },  
  body: JSON.stringify({
    origin: 'Parachain', // Replace "Parachain" with chain you wish to query transfer info for as origin
    destination: 'Parachain', // Replace "Parachain" with chain you wish to query transfer info for as destination
    currency: {currencySpec}, //{id: currencyID} | {symbol: currencySymbol}
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

- `from`: (required): Represents the Parachain from which the assets will be transferred.
- `exchange`: (optional): Represents the Parachain DEX on which tokens will be exchanged (If not provided, DEX is selected automatically based on best price output).
- `to`: (required): Represents the Parachain to which the assets will be transferred.
- `currencyFrom`: (required): Represents the asset being sent.
- `currencyTo`: (required): Represents the received asset.
- `amount`: (required): Specifies the amount of assets to transfer.
- `slippagePct`: (required): Specifies the slippage percentage.
- `address`: (required): Specifies the recipient's address.
- `injectorAddress`: (required): Specifies the sender's address.

```js
const response = await fetch('http://localhost:3001/router-hash', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from: 'Chain', //Origin Parachain/Relay chain
    exchange: 'Dex', //Exchange Parachain/Relay chain //Optional parameter, if not specified exchange will be auto-selected
    to: 'Chain', //Destination Parachain/Relay chain
    currencyFrom: {CurrencySpec}, // {id: currencyID} | {symbol: currencySymbol}
    currencyTo: {CurrencySpec}, // {id: currencyID} | {symbol: currencySymbol}
    amount: 'Amount', // Amount to send
    slippagePct: 'Pct', // Max slipppage percentage
    address: 'Address', //Recipient address
    injectorAddress: 'InjectorAddress', //Address of sender
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
const response = await fetch('http://localhost:3001/xcm-analyser', {
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

### Asset Pallet

A complete guide on this section can be found in [official docs](https://paraspell.github.io/docs/api/assetP.html).

Possible parameters:

- `node`: Specific Parachain eg. Moonbeam
- `asset`: Asset symbol eg. DOT
- `paraID`: Parachain ID eg. 2090 (Basilisk)

```js
//Retrieve assets object for a specific Parachain
const response = await fetch('http://localhost:3001/assets/:node');

//Retrieve asset ID for particular Parachain and asset
const response = await fetch(
  'http://localhost:3001/assets/:node/id?symbol=:asset',
);

//Retrieve the Relay chain asset Symbol for a particular Parachain
const response = await fetch(
  'http://localhost:3001/assets/:node/relay-chain-symbol',
);

//Retrieve native assets for a particular Parachain
const response = await fetch('http://localhost:3001/assets/:node/native');

//Retrieve foreign assets for a particular Parachain
const response = await fetch('http://localhost:3001/assets/:node/other');

//Retrieve all asset symbols for particular Parachain
const response = await fetch('http://localhost:3001/assets/:node/all-symbols');

//Retrieve support for a particular asset on a particular Parachain
const response = await fetch(
  'http://localhost:3001/assets/:node/has-support?symbol=:asset',
);

//Retrieve decimals for a particular asset for a particular Parachain
const response = await fetch(
  'http://localhost:3001/assets/:node/decimals?symbol=:asset',
);

//Retrieve Parachain ID for a particular Parachain
const response = await fetch('http://localhost:3001/assets/:node/para-id');

//Retrieve Parachain name from Parachain ID
const response = await fetch('http://localhost:3001/assets/:paraID');

//Retrieve a list of implemented Parachains
const response = await fetch('http://localhost:3001/assets');
```

### XCM Pallet

A complete guide on this section can be found in [official docs](https://paraspell.github.io/docs/api/nodeP.html).

Possible parameters:

- `node`: Specific Parachain eg. Moonbeam

```js
//Return default pallet for specific Parachain
const response = await fetch('http://localhost:3001/pallets/:node/default');

//Return an array of supported pallets for specific Parachain
const response = await fetch('http://localhost:3001/pallets/:node');
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
