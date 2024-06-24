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

```
NOTICE:
Latest version switched to POST method for XCM Transfers, but we kept GET method support. It will however be deprecated at some point. Please consider switching to POST method.
```

```js
//Construct XCM call from Relay chain to Parachain (DMP)
const response = await fetch("http://localhost:3001/x-transfer", {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        to: "Parachain",   // Replace "Parachain" with destination Parachain, e.g., "Moonbeam" or custom Multilocation
        amount: "Amount", // Replace "Amount" with the numeric value you wish to transfer
        address: "Address" // Replace "Address" with destination wallet address (In AccountID32 or AccountKey20 Format) or custom Multilocation
    })
});

//Construct XCM call from Parachain chain to Relay chain (UMP)
const response = await fetch("http://localhost:3001/x-transfer", {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        from: "Parachain", // Replace "Parachain" with sender Parachain, e.g., "Acala"
        amount: "Amount", // Replace "Amount" with the numeric value you wish to transfer
        address: "Address" // Replace "Address" with destination wallet address (In AccountID32 or AccountKey20 Format) or custom Multilocation
    })
});

//Construct XCM call from Parachain to Parachain (HRMP)
const response = await fetch("http://localhost:3001/x-transfer", {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        from: "Parachain", // Replace "Parachain" with sender Parachain, e.g., "Acala"
        to: "Parachain",   // Replace "Parachain" with destination Parachain, e.g., "Moonbeam" or custom Multilocation
        currency: "Currency", // Replace "Currency" with asset id or symbol, e.g., "DOT" or custom Multilocation
        amount: "Amount", // Replace "Amount" with the numeric value you wish to transfer
        address: "Address" // Replace "Address" with destination wallet address (In AccountID32 or AccountKey20 Format) or custom Multilocation
    })
});

//Construct custom multilocation XCM call from Parachain to Parachain (HRMP)
//Multilocations can be customized for Destination, Address and Currency.
const response = await fetch("http://localhost:3001/x-transfer", {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        from: "Parachain",   // Replace "Parachain" with sender Parachain, e.g., "Acala"
        to: "Parachain",    // Replace "Parachain" with destination Parachain, e.g., "Moonbeam" or custom Multilocation
        address: "Address", // Replace "Address" with destination wallet address (In AccountID32 or AccountKey20 Format) or custom Multilocation
        currency: {         // Replace "Currency" with asset id, symbol, e.g., "DOT" or custom Multilocation
            parents: 0,
            interior: {
                X2: [
                    { PalletInstance: "50" },
                    { GeneralIndex: "41" }
                ]
            }
        },
        amount: "Amount" // Replace "Amount" with the numeric value you wish to transfer
    })
});
```

### XCM Router
A complete guide on this section can be found in [official docs](https://paraspell.github.io/docs/api/xcmRouter.html).

NOTICE: It is advised to use at least 120s timeout with this endpoint (Because API has to connect to other endpoints and that is time dependent)

Possible parameters:
- `from` (Query parameter): (required): Represents the Parachain from which the assets will be transferred.
- `exchange` (Query parameter): (optional): Represents the Parachain DEX on which tokens will be exchanged (If not provided, DEX is selected automatically based on best price output).
- `to` (Query parameter): (required): Represents the Parachain to which the assets will be transferred.
- `currencyFrom` (Query parameter): (required): Represents the asset being sent.
- `currencyTo` (Query parameter): (required): Represents the asset being received. 
- `amount` (Query parameter): (required): Specifies the amount of assets to transfer.
- `slippagePct` (Query parameter): (required): Specifies the slippage percentage. 
- `address` (Query parameter): (required): Specifies the address of the recipient.
- `injectorAddress` (Query parameter): (required): Specifies the address of the sender.

```js
const response = await fetch(
    "http://localhost:3001/router?" +
    new URLSearchParams({
        from: "Polkadot", //Origin Parachain/Relay chain
        exchange: "AcalaDex", //Exchange Parachain/Relay chain
        to: "Interlay", //Destination Parachain/Relay chain
        currencyFrom: "DOT", // Currency to send
        currencyTo: "INTR", // Currency to receive
        amount: "100000", // Amount to send
        slippagePct: "1", // Max slipppage percentage
        address: "5F5586mfsnM6durWRLptYt3jSUs55KEmahdodQ5tQMr9iY96", //Recipient address
        injectorAddress: '5F5586mfsnM6durWRLptYt3jSUs55KEmahdodQ5tQMr9iY96', //Address of sender
    })
);
```

### Asset Pallet
A complete guide on this section can be found in [official docs](https://paraspell.github.io/docs/api/assetP.html).

Possible parameters:
- `node`: Specific Parachain eg. Moonbeam
- `asset`: Asset symbol eg. DOT
- `paraID`: Parachain ID eg. 2090 (Basilisk)

```js
//Retrieve assets object for a specific Parachain
const response = await fetch("http://localhost:3001/assets/:node");

//Retrieve asset ID for particular Parachain and asset
const response = await fetch("http://localhost:3001/assets/:node/id?symbol=:asset");

//Retrieve the Relay chain asset Symbol for a particular Parachain
const response = await fetch("http://localhost:3001/assets/:node/relay-chain-symbol");

//Retrieve native assets for a particular Parachain
const response = await fetch("http://localhost:3001/assets/:node/native");

//Retrieve foreign assets for a particular Parachain
const response = await fetch("http://localhost:3001/assets/:node/other");

//Retrieve all asset symbols for particular Parachain
const response = await fetch("http://localhost:3001/assets/:node/all-symbols");

//Retrieve support for a particular asset on a particular Parachain
const response = await fetch("http://localhost:3001/assets/:node/has-support?symbol=:asset");

//Retrieve decimals for a particular asset for a particular Parachain
const response = await fetch("http://localhost:3001/assets/:node/decimals?symbol=:asset");

//Retrieve Parachain ID for a particular Parachain
const response = await fetch("http://localhost:3001/assets/:node/para-id");

//Retrieve Parachain name from Parachain ID
const response = await fetch("http://localhost:3001/assets/:paraID");

//Retrieve a list of implemented Parachains
const response = await fetch("http://localhost:3001/assets");

```

### XCM Pallet
A complete guide on this section can be found in [official docs](https://paraspell.github.io/docs/api/nodeP.html).

Possible parameters:
- `node`: Specific Parachain eg. Moonbeam

```js
//Return default pallet for specific Parachain
const response = await fetch("http://localhost:3001/pallets/:node/default");

//Return an array of supported pallets for specific Parachain
const response = await fetch("http://localhost:3001/pallets/:node");
```

### HRMP Pallet
A complete guide on this section can be found in [official docs](https://paraspell.github.io/docs/api/hrmpP.html).

Possible parameters:
- `from` (Query parameter): (required): Specifies the origin Parachain.
- `to` (Query parameter): (required): Specifies the destination Parachain.
- `maxSize` (Query parameter): (required): Specifies the maximum size.
- `maxMessageSize` (Query parameter): (required): Specifies the maximum message size.
- `inbound` (Query parameter): (required): Specifies the maximum inbound.
- `outbound` (Query parameter):  (required): Specifies the maximum outbound.

```js
//Opening HRMP Channel
const response = await fetch(
    "http://localhost:3001/hrmp/channels?" +
    new URLSearchParams({
        from: Parachain, //eg. replace "Parachain" with "Moonbeam"
        to: Parachain,   //eg. replace "Parachain" with "Acala"
        maxSize: "8",
        maxMessageSize: "1024",
    }),
    { method: "POST" }
);

//Closing HRMP Channel
const response = await fetch(
    "http://localhost:3001/hrmp/channels?" +
    new URLSearchParams({
        from: Parachain, //eg. replace "Parachain" with "Moonriver"
        inbound: "0",
        outbound: "0",
    }),
    { method: "DELETE" }
);
```

## Running the API locally

### Installation
The following command installs all necessary packages.

NOTICE: Use Yarn v1.22 (Temporarily)

```bash
$ yarn
```

### Start nest server
The following commands allow you to start the nest server locally. You can then test its endpoints with various tools (eg. [Insomnia](https://insomnia.rest/)) or integrate it directly into your application.
```bash
# development
$ yarn start

# watch mode
$ yarn start:dev

# production mode
$ yarn start:prod
```

### Other

#### Upgrading request per minute count - [guide](https://paraspell.github.io/docs/api/upgrade.html).

#### Deploying API yourself - [guide](https://paraspell.github.io/docs/api/deploy.html).

## Tests

- Run linter using `yarn lint`

- Run unit and integration tests using `yarn test`

- Run end-to-end tests using `yarn test:e2e`

- Run coverage test `yarn test:cov`

API can be tested in [Playground](https://github.com/paraspell/xcm-tools/tree/main/apps/playground).

## License

Made with 💛 by [ParaSpell✨](https://github.com/paraspell)

Published under [MIT License](https://github.com/paraspell/xcm-tools/blob/main/apps/xcm-api/LICENSE).
