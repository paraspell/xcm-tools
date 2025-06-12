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

### Sending XCM

A complete guide on this section can be found in [official docs](https://paraspell.github.io/docs/api/xcmP.html).

Possible parameters:

- `from`: (required): Represents the Parachain from which the assets will be transferred.
- `to`: (required): Represents the Parachain to which the assets will be transferred. This can also be custom multilocation.
- `currency`: (required): Represents the asset being sent. It should be a string value. This can also be custom multilocation.
- `address`: (required): Specifies the address of the recipient. This can also be custom multilocation.
- `senderAddress`: (required): Specifies the address of the sender.
- `xcmVersion`: (optional): Specifies manually selected XCM version if pre-selected does not work. Format: Vx - where x = version number eg. V4.

```ts
//Construct XCM call from Relay chain to Parachain (DMP)
const response = await fetch('http://localhost:3001/v3/x-transfer', {
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
const response = await fetch('http://localhost:3001/v3/x-transfer', {
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
const response = await fetch('http://localhost:3001/v3/x-transfer', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from: 'Parachain', // Replace "Parachain" with sender Parachain, e.g., "Acala"
    to: 'Parachain', // Replace "Parachain" with destination Parachain, e.g., "Moonbeam" or custom Multilocation
    currency: { currencySpec }, //{id: currencyID, amount: amount} | {symbol: currencySymbol, amount: amount} | {symbol: Native('currencySymbol'), amount: amount} | {symbol: Foreign('currencySymbol'), amount: amount} | {symbol: ForeignAbstract('currencySymbol'), amount: amount} | {multilocation: AssetMultilocationString, amount: amount | AssetMultilocationJson, amount: amount} | {multilocation: Override('Custom Multilocation'), amount: amount} | {multiasset: {currencySelection, isFeeAsset?: true /* for example symbol: symbol or id: id, or multilocation: multilocation*/, amount: amount}}
    address: 'Address', // Replace "Address" with destination wallet address (In AccountID32 or AccountKey20 Format) or custom Multilocation
    senderAddress: "senderAddress" //Optional but strongly recommended as it is automatically ignored when not needed - Used when origin is AssetHub with feeAsset or when sending to AssetHub to prevent asset traps by auto-swapping to DOT to have DOT ED.
    //feeAsset: {id: currencyID} | {symbol: currencySymbol} | {multilocation: AssetMultilocationString | AssetMultilocationJson} //Optional parameter used when multiasset is provided or when origin is AssetHub - so user can pay in fees different than DOT
    //xcmVersion: "Vx" //Optional parameter - replace "Vx" with V and version number eg. "V4"
    //pallet: 'RandomXTokens', //Optional parameter - replace RandomXtokens with Camel case name of the pallet
	  //method: 'random_function' //Optional parameter - replace random_function with snake case name of the method
  }),
});

//Construct local asset transfer
const response = await fetch('http://localhost:3001/v3/x-transfer', {
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
const response = await fetch('http://localhost:3001/v3/x-transfer', {
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

//Construct custom batch of XCM Calls
const response = await fetch('http://localhost:3001/v3/x-transfer-batch', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    transfers: 'Parachain', // Replace "transfers" with array of XCM transfers
  }),
});

//Construct asset claim call
const response = await fetch('http://localhost:3001/v3/asset-claim', {
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

//DryRun your XCM calls to find whether they will execute
const response = await fetch('http://localhost:3001/v3/dry-run', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from: 'Parachain', // Replace "Parachain" with sender Parachain or Relay chain, e.g., "Acala"
    to: 'Parachain', // Replace "Parachain" with destination Parachain or Relay chain, e.g., "Moonbeam" or custom Multilocation
    currency: { currencySpec }, //{id: currencyID, amount: amount} | {symbol: currencySymbol, amount: amount} | {symbol: Native('currencySymbol'), amount: amount} | {symbol: Foreign('currencySymbol'), amount: amount} | {symbol: ForeignAbstract('currencySymbol'), amount: amount} | {multilocation: AssetMultilocationString, amount: amount | AssetMultilocationJson, amount: amount} | {multilocation: Override('Custom Multilocation'), amount: amount} | {multiasset: {currencySelection, isFeeAsset?: true /* for example symbol: symbol or id: id, or multilocation: multilocation*/, amount: amount}}
    //feeAsset: {id: currencyID} | {symbol: currencySymbol} | {multilocation: AssetMultilocationString | AssetMultilocationJson} //Optional parameter used when multiasset is provided or when origin === AssetHubPolkadot and TX is supposed to be paid in same fee asset as selected currency
    address: 'Address', // Replace "Address" with destination wallet address (In AccountID32 or AccountKey20 Format) or custom Multilocation
    senderAddress: 'Address' //Replace "Address" with sender address from origin chain
  }),
});
```

### XCM Fee queries

A complete guide on this section can be found in [official docs](https://paraspell.github.io/docs/api/xcmP.html).

Possible parameters:

- `from`: (required): Represents the Parachain from which the assets will be transferred.
- `to`: (required): Represents the Parachain to which the assets will be transferred. This can also be custom multilocation.
- `currency`: (required): Represents the asset being sent. It should be a string value. This can also be custom multilocation.
- `address`: (required): Specifies the address of the recipient. This can also be custom multilocation.
- `senderAddress`: (required): Specifies the address of the sender.

```ts
//Perform comprehensive transfer info query that will retrieve all details regarding fees and balances that will be changed by performing selected XCM call
const response = await fetch(
  'http://localhost:3001/v3/transfer-info' , {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },  
    from: 'Parachain', // Replace "Parachain" with sender Parachain or Relay chain, e.g., "Acala"
    to: 'Parachain', // Replace "Parachain" with destination Parachain or Relay chain, e.g., "Moonbeam" or custom Multilocation
    currency: { currencySpec }, //{id: currencyID, amount: amount} | {symbol: currencySymbol, amount: amount} | {symbol: Native('currencySymbol'), amount: amount} | {symbol: Foreign('currencySymbol'), amount: amount} | {symbol: ForeignAbstract('currencySymbol'), amount: amount} | {multilocation: AssetMultilocationString, amount: amount | AssetMultilocationJson, amount: amount} | {multilocation: Override('Custom Multilocation'), amount: amount} | {multiasset: {currencySelection, isFeeAsset?: true /* for example symbol: symbol or id: id, or multilocation: multilocation*/, amount: amount}}
    //feeAsset: {id: currencyID} | {symbol: currencySymbol} | {multilocation: AssetMultilocationString | AssetMultilocationJson} //Optional parameter used when multiasset is provided or when origin === AssetHubPolkadot and TX is supposed to be paid in same fee asset as selected currency
    address: 'Address', // Replace "Address" with destination wallet address (In AccountID32 or AccountKey20 Format) or custom Multilocation
    senderAddress: 'Address' //Replace "Address" with sender address from origin chain
  }),

//Query maximal transferable balance for specific currency on specific account
const response = await fetch(
  'http://localhost:3001/v3/transferable-amount' , {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },  
    from: 'Parachain', // Replace "Parachain" with sender Parachain or Relay chain, e.g., "Acala"
    to: 'Parachain', // Replace "Parachain" with destination Parachain or Relay chain, e.g., "Moonbeam" or custom Multilocation
    currency: { currencySpec }, //{id: currencyID, amount: amount} | {symbol: currencySymbol, amount: amount} | {symbol: Native('currencySymbol'), amount: amount} | {symbol: Foreign('currencySymbol'), amount: amount} | {symbol: ForeignAbstract('currencySymbol'), amount: amount} | {multilocation: AssetMultilocationString, amount: amount | AssetMultilocationJson, amount: amount} | {multilocation: Override('Custom Multilocation'), amount: amount} | {multiasset: {currencySelection, isFeeAsset?: true /* for example symbol: symbol or id: id, or multilocation: multilocation*/, amount: amount}}
    //feeAsset: {id: currencyID} | {symbol: currencySymbol} | {multilocation: AssetMultilocationString | AssetMultilocationJson} //Optional parameter used when multiasset is provided or when origin === AssetHubPolkadot and TX is supposed to be paid in same fee asset as selected currency
    address: 'Address', // Replace "Address" with destination wallet address (In AccountID32 or AccountKey20 Format) or custom Multilocation
    senderAddress: 'Address' //Replace "Address" with sender address from origin chain
  }),

//Verify whether the existential deposit will be met when XCM message will be sent to destination chain
const response = await fetch(
  'http://localhost:3001/v3/verify-ed-on-destination' , {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },  
    from: 'Parachain', // Replace "Parachain" with sender Parachain or Relay chain, e.g., "Acala"
    to: 'Parachain', // Replace "Parachain" with destination Parachain or Relay chain, e.g., "Moonbeam" or custom Multilocation
    currency: { currencySpec }, //{id: currencyID, amount: amount} | {symbol: currencySymbol, amount: amount} | {symbol: Native('currencySymbol'), amount: amount} | {symbol: Foreign('currencySymbol'), amount: amount} | {symbol: ForeignAbstract('currencySymbol'), amount: amount} | {multilocation: AssetMultilocationString, amount: amount | AssetMultilocationJson, amount: amount} | {multilocation: Override('Custom Multilocation'), amount: amount} | {multiasset: {currencySelection, isFeeAsset?: true /* for example symbol: symbol or id: id, or multilocation: multilocation*/, amount: amount}}
    //feeAsset: {id: currencyID} | {symbol: currencySymbol} | {multilocation: AssetMultilocationString | AssetMultilocationJson} //Optional parameter used when multiasset is provided or when origin === AssetHubPolkadot and TX is supposed to be paid in same fee asset as selected currency
    address: 'Address', // Replace "Address" with destination wallet address (In AccountID32 or AccountKey20 Format) or custom Multilocation
    senderAddress: 'Address' //Replace "Address" with sender address from origin chain
  }),

//XCM Fee (Origin & Destination) - More accurate (Using DryRun)
const response = await fetch("http://localhost:3001/v3/xcm-fee", {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        from: "Parachain", // Replace "Parachain" with sender Parachain, e.g., "Acala"
        to: "Parachain",   // Replace "Parachain" with destination Parachain, e.g., "Moonbeam" or custom Multilocation
        currency: { currencySpec }, //{id: currencyID, amount: amount} | {symbol: currencySymbol, amount: amount} | {symbol: Native('currencySymbol'), amount: amount} | {symbol: Foreign('currencySymbol'), amount: amount} | {symbol: ForeignAbstract('currencySymbol'), amount: amount} | {multilocation: AssetMultilocationString, amount: amount | AssetMultilocationJson, amount: amount} | {multilocation: Override('Custom Multilocation'), amount: amount} | {multiasset: {currencySelection, isFeeAsset?: true /* for example symbol: symbol or id: id, or multilocation: multilocation*/, amount: amount}}
        //feeAsset: {id: currencyID} | {symbol: currencySymbol} | {multilocation: AssetMultilocationString | AssetMultilocationJson} //Optional parameter used when multiasset is provided or when origin === AssetHubPolkadot and TX is supposed to be paid in same fee asset as selected currency
        address: "Address" // Replace "Address" with destination wallet address (In AccountID32 or AccountKey20 Format)
        senderAddress: "Address" // Replace "Address" with sender wallet address (In AccountID32 or AccountKey20 Format) 
        /*disableFallback: "True" //Optional parameter - if enabled it disables fallback to payment info if dryrun fails only returning dryrun error but no fees.*/
    })
});

//XCM Fee (Origin & Destination) - Less accurate (Using payment info)
const response = await fetch("http://localhost:3001/v3/xcm-fee-estimate", {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        from: "Parachain", // Replace "Parachain" with sender Parachain, e.g., "Acala"
        to: "Parachain",   // Replace "Parachain" with destination Parachain, e.g., "Moonbeam" or custom Multilocation
        currency: { currencySpec }, //{id: currencyID, amount: amount} | {symbol: currencySymbol, amount: amount} | {symbol: Native('currencySymbol'), amount: amount} | {symbol: Foreign('currencySymbol'), amount: amount} | {symbol: ForeignAbstract('currencySymbol'), amount: amount} | {multilocation: AssetMultilocationString, amount: amount | AssetMultilocationJson, amount: amount} | {multilocation: Override('Custom Multilocation'), amount: amount} | {multiasset: {currencySelection, isFeeAsset?: true /* for example symbol: symbol or id: id, or multilocation: multilocation*/, amount: amount}}
        address: "Address" // Replace "Address" with destination wallet address (In AccountID32 or AccountKey20 Format)
        senderAddress: "Address" // Replace "Address" with sender wallet address (In AccountID32 or AccountKey20 Format) 
    })
});

//XCM Fee (Origin) - More accurate (Using DryRun)
const response = await fetch("http://localhost:3001/v3/origin-xcm-fee", {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        from: "Parachain", // Replace "Parachain" with sender Parachain, e.g., "Acala"
        to: "Parachain",   // Replace "Parachain" with destination Parachain, e.g., "Moonbeam" or custom Multilocation
        currency: { currencySpec }, //{id: currencyID, amount: amount} | {symbol: currencySymbol, amount: amount} | {symbol: Native('currencySymbol'), amount: amount} | {symbol: Foreign('currencySymbol'), amount: amount} | {symbol: ForeignAbstract('currencySymbol'), amount: amount} | {multilocation: AssetMultilocationString, amount: amount | AssetMultilocationJson, amount: amount} | {multilocation: Override('Custom Multilocation'), amount: amount} | {multiasset: {currencySelection, isFeeAsset?: true /* for example symbol: symbol or id: id, or multilocation: multilocation*/, amount: amount}}
        //feeAsset: {id: currencyID} | {symbol: currencySymbol} | {multilocation: AssetMultilocationString | AssetMultilocationJson} //Optional parameter used when multiasset is provided or when origin === AssetHubPolkadot and TX is supposed to be paid in same fee asset as selected currency
        address: "Address" // Replace "Address" with destination wallet address (In AccountID32 or AccountKey20 Format)
        senderAddress: "Address" // Replace "Address" with sender wallet address (In AccountID32 or AccountKey20 Format) 
        /*disableFallback: "True" //Optional parameter - if enabled it disables fallback to payment info if dryrun fails only returning dryrun error but no fees.*/
    })
});

//XCM Fee (Origin) - Less accurate (Using payment info)
const response = await fetch("http://localhost:3001/v3/origin-xcm-fee-estimate", {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        from: "Parachain", // Replace "Parachain" with sender Parachain, e.g., "Acala"
        to: "Parachain",   // Replace "Parachain" with destination Parachain, e.g., "Moonbeam" or custom Multilocation
        currency: { currencySpec }, //{id: currencyID, amount: amount} | {symbol: currencySymbol, amount: amount} | {symbol: Native('currencySymbol'), amount: amount} | {symbol: Foreign('currencySymbol'), amount: amount} | {symbol: ForeignAbstract('currencySymbol'), amount: amount} | {multilocation: AssetMultilocationString, amount: amount | AssetMultilocationJson, amount: amount} | {multilocation: Override('Custom Multilocation'), amount: amount} | {multiasset: {currencySelection, isFeeAsset?: true /* for example symbol: symbol or id: id, or multilocation: multilocation*/, amount: amount}}
        address: "Address" // Replace "Address" with destination wallet address (In AccountID32 or AccountKey20 Format)
        senderAddress: "Address" // Replace "Address" with sender wallet address (In AccountID32 or AccountKey20 Format) 
    })
});

// Retrieve specific asset balance for specific chain
const response = await fetch("http://localhost:3001/v3/balance/:node/asset", {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        address: "Address" // Replace "Address" with wallet address (In AccountID32 or AccountKey20 Format) 
        currency: {currencySpec}, //{id: currencyID} | {symbol: currencySymbol} | {"symbol": {"type": "Native","value": "currencySymbol"} | {"symbol": {"type": "Foreign","value": "currencySymbol"} | {"symbol": {"type": "ForeignAbstract","value": "currencySymbolAlias"} | {multilocation: AssetMultilocationString} | {multilocation: AssetMultilocationJson} | {multilocation: "type": "Override","value": "CustomAssetMultilocationJson"}
    })
});

// Retrieve existential deposit for specific assets on selected chain
const response = await fetch("http://localhost:3001/v3/balance/:node/existential-deposit", {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        currency: "Currency" //Replace "Currency" with {id: currencyID} | {symbol: currencySymbol} | {"symbol": {"type": "Native","value": "currencySymbol"} | {"symbol": {"type": "Foreign","value": "currencySymbol"} | {"symbol": {"type": "ForeignAbstract","value": "currencySymbolAlias"} | {multilocation: AssetMultilocationString} | {multilocation: AssetMultilocationJson}
    })
});

// Convert SS58 address to Parachain specific format
const response = await fetch('http://localhost:3001/v3/convert-ss58?address=:address&node=:node');
```

### Asset queries

A complete guide on this section can be found in [official docs](https://paraspell.github.io/docs/api/assetP.html).

Possible parameters:

- `node`: Specific Parachain eg. Moonbeam
- `asset`: Asset symbol eg. DOT
- `paraID`: Parachain ID eg. 2090 (Basilisk)

```ts

// Retrieve Fee asset queries (Assets accepted as XCM Fee on specific node)
const response = await fetch('http://localhost:3001/v3/assets/:node/fee-assets');

// Retrieve assets object for a specific Parachain
const response = await fetch('http://localhost:3001/v3/assets/:node');

// Retrieve asset ID for particular Parachain and asset
const response = await fetch(
  'http://localhost:3001/v3/assets/:node/id?symbol=:asset',
);

// Retrieve the Relay chain asset Symbol for a particular Parachain
const response = await fetch(
  'http://localhost:3001/v3/assets/:node/relay-chain-symbol',
);

// Retrieve native assets for a particular Parachain
const response = await fetch('http://localhost:3001/v3/assets/:node/native');

// Retrieve foreign assets for a particular Parachain
const response = await fetch('http://localhost:3001/v3/assets/:node/other');

// Retrieve all asset symbols for particular Parachain
const response = await fetch('http://localhost:3001/v3/assets/:node/all-symbols');

// Retrieve support for a particular asset on a particular Parachain
const response = await fetch(
  'http://localhost:3001/v3/assets/:node/has-support?symbol=:asset',
);

// Retrieve decimals for a particular asset for a particular Parachain
const response = await fetch(
  'http://localhost:3001/v3/assets/:node/decimals?symbol=:asset',
);

// Retrieve Parachain ID for a particular Parachain
const response = await fetch('http://localhost:3001/v3/nodes/:node/para-id');

// Retrieve Parachain name from Parachain ID
const response = await fetch('http://localhost:3001/v3/nodes/:paraID?ecosystem=polkadot');

// Retrieve a list of implemented Parachains
const response = await fetch('http://localhost:3001/v3/nodes');

// Query list of node WS endpoints
const response = await fetch('http://localhost:3001/v3/nodes/:node/ws-endpoints');

// Query supported assets supported between two nodes
const response = await fetch('http://localhost:3001/v3/supported-assets?origin=:node&destination=:node');

// Retrieve multilocation for asset id or symbol for specific assets on selected chain
const response = await fetch("http://localhost:3001/v3/assets/:node/multilocation", {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        currency: "Currency" //Replace "Currency" with {id: currencyID} | {symbol: currencySymbol} | {"symbol": {"type": "Native","value": "currencySymbol"} | {"symbol": {"type": "Foreign","value": "currencySymbol"} | {"symbol": {"type": "ForeignAbstract","value": "currencySymbolAlias"}
    })
});

//Get chains that support the specific asset related to origin
const response = await fetch("http://localhost:3001/v3/assets/:node/supported-destinations", {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        currency: "Currency" //Replace "Currency" with {id: currencyID} | {symbol: currencySymbol} | {"symbol": {"type": "Native","value": "currencySymbol"} | {"symbol": {"type": "Foreign","value": "currencySymbol"} | {"symbol": {"type": "ForeignAbstract","value": "currencySymbolAlias"}
    })
});
```

### XCM Pallet queries

A complete guide on this section can be found in [official docs](https://paraspell.github.io/docs/api/nodeP.html).

Possible parameters:

- `node`: Specific Parachain eg. Moonbeam

```ts
// Return default pallet for specific Parachain
const response = await fetch('http://localhost:3001/v3/pallets/:node/default');

// Return an array of supported pallets for a specific Parachain
const response = await fetch('http://localhost:3001/v3/pallets/:node');

// Return ID of the specific cross-chain pallet for specific Parachain
const response = await fetch('http://localhost:3001/v3/pallets/:node/index?pallet=XTokens');

// Return Parachain support for DryRun
const response = await fetch('http://localhost:3001/v3/nodes/:node/has-dry-run-support');
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

```ts
const response = await fetch('http://localhost:3001/v3/router', {
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

```ts
const response = await fetch('http://localhost:3001/v3/xcm-analyser', {
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
