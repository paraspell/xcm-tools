<br /><br />

<div align="center">
  <h1 align="center">XCM-API</h1>
  <h4 align="center">The 🥇 XCM-API for Polkadot, Kusama, Paseo & Westend ecosystems.</h4>
  <h4 align="center">Enhance the cross-chain experience of your decentralized application. Package-lessly.</h4>

  <p align="center">
    <a href="https://github.com/paraspell/xcm-sdk/actions">
      <img alt="build" src="https://github.com/paraspell/xcm-tools/actions/workflows/ci.yml/badge.svg" />
    </a>
    <a href="https://status.paraspell.xyz/">
      <img alt="XCM API Status" src="https://status.paraspell.xyz/api/badge/3/status" />
    </a>
  </p>

  <p align="center">Now live at https://api.paraspell.xyz/v1</p>

  <p>XCM API downtime monitoring <a href="https://status.paraspell.xyz/">[here]</a></p>
  <p>XCM API documentation <a href="https://paraspell.github.io/docs/xcm-api/getting-started.html">[here]</a></p>
  <p>XCM API starter template project <a href="https://github.com/paraspell/xcm-api-template">[here]</a></p>
</div>
<br /><br />

## Implementation

### Sending XCM

A complete guide on this section can be found in [official docs](https://paraspell.github.io/docs/xcm-api/xcm-sdk-functionality.html).

Possible parameters:

- `from`: (required): Represents the Chain from which the assets will be transferred.
- `to`: (required): Represents the Chain to which the assets will be transferred. This can also be custom location.
- `currency`: (required): Represents the asset being sent. It should be a string value. This can also be custom location.
- `recipient`: (required): Specifies the address of the recipient. This can also be custom location.
- `sender`: (required): Specifies the address of the sender.
- `xcmVersion`: (optional): Specifies manually selected XCM version if pre-selected does not work. Format: Vx - where x = version number eg. V4.

```ts
//Construct XCM call from Substrate to Substrate
const response = await fetch('http://localhost:3001/v1/x-transfer', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from: 'TChain', // Replace "TChain" with sender Chain, for example "Polkadot"
    to: 'TChain', // Replace "TChain" with destination Chain, for example "AssetHubPolkadot" or custom location
    currency: { currencySpec }, //{id: currencyID, amount: amount /*Use "ALL" to transfer everything*/} | {symbol: currencySymbol, amount: amount /*Use "ALL" to transfer everything*/} | {symbol: Native('currencySymbol'), amount: amount /*Use "ALL" to transfer everything*/} | {symbol: Foreign('currencySymbol'), amount: amount /*Use "ALL" to transfer everything*/} | {symbol: ForeignAbstract('currencySymbol'), amount: amount /*Use "ALL" to transfer everything*/} | {location: AssetLocationString, amount: amount /*Use "ALL" to transfer everything*/ | AssetLocationJson, amount: amount /*Use "ALL" to transfer everything*/} | {location: Override('Custom location'), amount: amount /*Use "ALL" to transfer everything*/} | [ {currencySelection, isFeeAsset?: true /* for example symbol: symbol or id: id, or location: location*/, amount: amount /*Use "ALL" to transfer everything*/}]
    recipient: 'Address', // Replace "Address" with destination wallet address (In AccountID32 or AccountKey20 Format) or custom location
    sender: "sender" //Optional but strongly recommended as it is automatically ignored when not needed - Used when origin is AssetHub with feeAsset or when sending to AssetHub to prevent asset traps by auto-swapping to DOT to have DOT ED.
    //feeAsset: {id: currencyID} | {symbol: currencySymbol} | {location: AssetLocationString | AssetLocationJson} //Optional parameter used when multiasset is provided or when origin is AssetHub - so user can pay in fees different than DOT
    //xcmVersion: "Vx" //Optional parameter - replace "Vx" with V and version number eg. "V4"
    //pallet: 'RandomXTokens', //Optional parameter - replace RandomXtokens with Camel case name of the pallet
	  //method: 'random_function' //Optional parameter - replace random_function with snake case name of the method
  }),
});

//Construct local asset transfer
const response = await fetch('http://localhost:3001/v1/x-transfer', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from: 'TChain', // Replace "TChain" with sender Chain, for example "Polkadot"
    to: 'TChain', // Replace "TChain" with same parameter as "from" parameter
    currency: { currencySpec }, //{id: currencyID, amount: amount /*Use "ALL" to transfer everything*/} | {symbol: currencySymbol, amount: amount /*Use "ALL" to transfer everything*/} | {symbol: Native('currencySymbol'), amount: amount /*Use "ALL" to transfer everything*/} | {symbol: Foreign('currencySymbol'), amount: amount /*Use "ALL" to transfer everything*/} | {symbol: ForeignAbstract('currencySymbol'), amount: amount /*Use "ALL" to transfer everything*/} | {location: AssetLocationString, amount: amount /*Use "ALL" to transfer everything*/ | AssetLocationJson, amount: amount /*Use "ALL" to transfer everything*/} | {location: Override('Custom location'), amount: amount /*Use "ALL" to transfer everything*/} | [ {currencySelection, isFeeAsset?: true /* for example symbol: symbol or id: id, or location: location*/, amount: amount /*Use "ALL" to transfer everything*/}]
    recipient: 'Address', // Replace "Address" with destination wallet address (In AccountID32 or AccountKey20 Format) or custom location
  }),
});

//Transact call
const response = await fetch('http://localhost:3001/v1/x-transfer', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from: 'Chain', // Replace "Chain" with sender Chain, e.g., "Acala"
    to: 'Chain', // Replace Chain with same parameter as "from" parameter
    currency: { currencySpec }, // Refer to currency spec options above
    recipient: 'Address', // Replace "Address" with destination wallet address (In AccountID32 or AccountKey20 Format) or custom Location
    sender: 'sender', //Replace "sender" with sender wallet address (In AccountID32 or AccountKey20 Format)
    transact: {
      hex: Destination call hex //Function that should execute on destination
    /*originKind: "SovereignAccount" || "XCM" || "Native" || "SuperUser" - Optional, "SovereignAccount" by default
      maxWeight: { proofSize: string, refTime: string } - Optional, autofilled by default (Utilized in V3 and V4 as maxFallbackWeight parameter)*/
    }
  }),
});

//Swap call
const response = await fetch('http://localhost:3001/v1/x-transfers', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from: 'Chain', // Replace "Chain" with sender Chain, e.g., "Acala"
    to: 'Chain', // Replace Chain with same parameter as "from" parameter
    currency: { currencySpec }, //{id: currencyID, amount: amount /*Use "ALL" to transfer everything*/} | {symbol: currencySymbol, amount: amount /*Use "ALL" to transfer everything*/} | {symbol: Native('currencySymbol'), amount: amount /*Use "ALL" to transfer everything*/} | {symbol: Foreign('currencySymbol'), amount: amount /*Use "ALL" to transfer everything*/} | {symbol: ForeignAbstract('currencySymbol'), amount: amount /*Use "ALL" to transfer everything*/} | {location: AssetLocationString, amount: amount /*Use "ALL" to transfer everything*/ | AssetLocationJson, amount: amount /*Use "ALL" to transfer everything*/} | {location: Override('Custom location'), amount: amount /*Use "ALL" to transfer everything*/} | [currencySelection, isFeeAsset?: true /* for example symbol: symbol or id: id, or location: location*/, amount: amount /*Use "ALL" to transfer everything*/}]
    //feeAsset: {id: currencyID} | {symbol: currencySymbol} | {location: AssetLocationString | AssetLocationJson} //Optional parameter used when multiasset is provided or when origin === AssetHubPolkadot and TX is supposed to be paid in same fee asset as selected currency
    recipient: 'Address', // Replace "Address" with destination wallet address (In AccountID32 or AccountKey20 Format) or custom Location
    sender: 'sender', //Replace "sender" with sender wallet address (In AccountID32 or AccountKey20 Format)
    swapOptions: {
      currencyTo: { currencySpec }, //{id: currencyID, amount: amount /*Use "ALL" to transfer everything*/} | {symbol: currencySymbol, amount: amount /*Use "ALL" to transfer everything*/} | {symbol: Native('currencySymbol'), amount: amount /*Use "ALL" to transfer everything*/} | {symbol: Foreign('currencySymbol'), amount: amount /*Use "ALL" to transfer everything*/} | {symbol: ForeignAbstract('currencySymbol'), amount: amount /*Use "ALL" to transfer everything*/} | {location: AssetLocationString, amount: amount /*Use "ALL" to transfer everything*/ | AssetLocationJson, amount: amount /*Use "ALL" to transfer everything*/} | {location: Override('Custom location'), amount: amount /*Use "ALL" to transfer everything*/} | [currencySelection, isFeeAsset?: true /* for example symbol: symbol or id: id, or location: location*/, amount: amount /*Use "ALL" to transfer everything*/}]
      // exchange: ['AssetHubPolkadot'], - Optional parameter - 'Hydration' | 'Acala' | 'AssetHubPolkadot' | ...
      // slippage: 1, - Optional - 1 by default
      // evmsender: '0x000', - Optional parameter when origin CHAIN is EVM based (Required with evmSigner)
    },
  }),
});

//DryRun your XCM calls to find whether they will execute
const response = await fetch('http://localhost:3001/v1/dry-run', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from: 'TChain', // Replace "TChain" with sender Chain, for example "Polkadot"
    to: 'TChain', // Replace "TChain" with destination Chain, for example "AssetHubPolkadot" or custom location
    currency: { currencySpec }, //{id: currencyID, amount: amount /*Use "ALL" to transfer everything*/} | {symbol: currencySymbol, amount: amount /*Use "ALL" to transfer everything*/} | {symbol: Native('currencySymbol'), amount: amount /*Use "ALL" to transfer everything*/} | {symbol: Foreign('currencySymbol'), amount: amount /*Use "ALL" to transfer everything*/} | {symbol: ForeignAbstract('currencySymbol'), amount: amount /*Use "ALL" to transfer everything*/} | {location: AssetLocationString, amount: amount /*Use "ALL" to transfer everything*/ | AssetLocationJson, amount: amount /*Use "ALL" to transfer everything*/} | {location: Override('Custom location'), amount: amount /*Use "ALL" to transfer everything*/} | [currencySelection, isFeeAsset?: true /* for example symbol: symbol or id: id, or location: location*/, amount: amount /*Use "ALL" to transfer everything*/}]
    //feeAsset: {id: currencyID} | {symbol: currencySymbol} | {location: AssetLocationString | AssetLocationJson} //Optional parameter used when multiasset is provided or when origin === AssetHubPolkadot and TX is supposed to be paid in same fee asset as selected currency
    recipient: 'Address', // Replace "Address" with destination wallet address (In AccountID32 or AccountKey20 Format) or custom location
    sender: 'Address' //Replace "Address" with sender address from origin chain
  }),
});

//Preview dryrun result of different amount than you currently have
const response = await fetch('http://localhost:3001/v1/dry-run-preview', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from: 'TChain', // Replace "TChain" with sender Chain, for example "Polkadot"
    to: 'TChain', // Replace "TChain" with destination Chain, for example "AssetHubPolkadot" or custom location
    currency: { currencySpec }, //{id: currencyID, amount: amount /*Use "ALL" to transfer everything*/} | {symbol: currencySymbol, amount: amount /*Use "ALL" to transfer everything*/} | {symbol: Native('currencySymbol'), amount: amount /*Use "ALL" to transfer everything*/} | {symbol: Foreign('currencySymbol'), amount: amount /*Use "ALL" to transfer everything*/} | {symbol: ForeignAbstract('currencySymbol'), amount: amount /*Use "ALL" to transfer everything*/} | {location: AssetLocationString, amount: amount /*Use "ALL" to transfer everything*/ | AssetLocationJson, amount: amount /*Use "ALL" to transfer everything*/} | {location: Override('Custom location'), amount: amount /*Use "ALL" to transfer everything*/} | [currencySelection, isFeeAsset?: true /* for example symbol: symbol or id: id, or location: location*/, amount: amount /*Use "ALL" to transfer everything*/}]
    //feeAsset: {id: currencyID} | {symbol: currencySymbol} | {location: AssetLocationString | AssetLocationJson} //Optional parameter used when multiasset is provided or when origin === AssetHubPolkadot and TX is supposed to be paid in same fee asset as selected currency
    recipient: 'Address', // Replace "Address" with destination wallet address (In AccountID32 or AccountKey20 Format) or custom location
    sender: 'Address' //Replace "Address" with sender address from origin chain
  }),
});

//Construct custom batch of XCM Calls
const response = await fetch('http://localhost:3001/v1/x-transfer-batch', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    transfers, // Replace "transfers" with array of XCM transfers
  }),
});

```

### Localhost testing setup

A complete guide on this section can be found in [official docs](https://paraspell.github.io/docs/xcm-api/xcm-sdk-functionality.html#localhost-testing-setup).

Possible parameters:
- Inherited from concrete endpoint

```ts
const response = await fetch("http://localhost:3001/v1/x-transfer", {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        sender: "1pze8UbJDcDAacrXcwkpqeRSYLphaAiXB8rUaC6Z3V1kBLq",
        recipient: "0x1501C1413e4178c38567Ada8945A80351F7B8496",
        from: "Hydration",
        to: "Ethereum",
        currency: {
          symbol: "USDC.e",
          amount: "10"
        },
        options: {
          development: true, // Optional: Enforces overrides for all chains used
          decimalAbstraction: true, // TRUE BY DEFAULT Abstracts decimals, so 1 as input amount equals 10_000_000_000 if selected asset is DOT
          xcmFormatCheck: true, // Dryruns each call under the hood with dryrun bypass to confirm message passes with fictional balance
          apiOverrides: {
            Hydration: "wss://hydration.ibp.network",
            AssetHubPolkadot: "wss://dot-rpc.stakeworld.io/assethub"
            BridgeHubPolkadot: "wss://sys.ibp.network/bridgehub-polkadot"
          }
        }
    })
});
```

### Localhost testing setup II

A complete guide on this section can be found in [official docs](https://paraspell.github.io/docs/xcm-api/xcm-sdk-functionality.html#localhost-testing-setup-ii).

Possible parameters:
- Inherited from concrete endpoint

```ts
const response = await fetch("http://localhost:3001/v1/sign-and-submit", {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        sender: "//Alice", //You can use prederived accounts - //Alice, //Bob... //Alith, //Balthathar...
        recipient: "0x1501C1413e4178c38567Ada8945A80351F7B8496", //You can also use prederived accounts here - //Alice, //Bob... //Alith, //Balthathar...
        from: "Hydration",
        to: "Moonbeam",
        currency: {
          symbol: "HDX",
          amount: "10"
        },
        options: {
          development: true, // Optional: Enforces overrides for all chains used
          decimalAbstraction: true, // TRUE BY DEFAULT Abstracts decimals, so 1 as input amount equals 10_000_000_000 if selected asset is DOT
          xcmFormatCheck: true, // Dryruns each call under the hood with dryrun bypass to confirm message passes with fictional balance
          apiOverrides: {
            Hydration: "ws://127.0.0.1:8000", //Only works with locally launched chains (Eg. chopsticks)
            Moonbeam: "ws://127.0.0.1:8001" //Only works with locally launched chains (Eg. chopsticks)
          }
        }
    })
});
```


### XCM Fee queries

A complete guide on this section can be found in [official docs](https://paraspell.github.io/docs/xcm-api/xcm-sdk-functionality.html).

Possible parameters:

- `from`: (required): Represents the Chain from which the assets will be transferred.
- `to`: (required): Represents the Chain to which the assets will be transferred. This can also be custom location.
- `currency`: (required): Represents the asset being sent. It should be a string value. This can also be custom location.
- `recipient`: (required): Specifies the address of the recipient. This can also be custom location.
- `sender`: (required): Specifies the address of the sender.

```ts
//XCM Fee (Origin & Destination)
const response = await fetch("http://localhost:3001/v1/xcm-fee", {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
	    from: 'TChain', // Replace "TChain" with sender Chain, for example "Polkadot"
	    to: 'TChain', // Replace "TChain" with destination Chain, for example "AssetHubPolkadot" or custom location
        currency: { currencySpec }, //{id: currencyID, amount: amount /*Use "ALL" to transfer everything*/} | {symbol: currencySymbol, amount: amount /*Use "ALL" to transfer everything*/} | {symbol: Native('currencySymbol'), amount: amount /*Use "ALL" to transfer everything*/} | {symbol: Foreign('currencySymbol'), amount: amount /*Use "ALL" to transfer everything*/} | {symbol: ForeignAbstract('currencySymbol'), amount: amount /*Use "ALL" to transfer everything*/} | {location: AssetLocationString, amount: amount /*Use "ALL" to transfer everything*/ | AssetLocationJson, amount: amount /*Use "ALL" to transfer everything*/} | {location: Override('Custom location'), amount: amount /*Use "ALL" to transfer everything*/} | [ {currencySelection, isFeeAsset?: true /* for example symbol: symbol or id: id, or location: location*/, amount: amount /*Use "ALL" to transfer everything*/}]
        //feeAsset: {id: currencyID} | {symbol: currencySymbol} | {location: AssetLocationString | AssetLocationJson} //Optional parameter used when multiasset is provided or when origin === AssetHubPolkadot and TX is supposed to be paid in same fee asset as selected currency
        recipient: "Address", // Replace "Address" with destination wallet address (In AccountID32 or AccountKey20 Format)
        sender: "Address" // Replace "Address" with sender wallet address (In AccountID32 or AccountKey20 Format) 
        /*disableFallback: "True" //Optional parameter - if enabled it disables fallback to payment info if dryrun fails only returning dryrun error but no fees.*/
    })
});

//XCM Fee (Origin)
const response = await fetch("http://localhost:3001/v1/origin-xcm-fee", {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
	    from: 'TChain', // Replace "TChain" with sender Chain, for example "Polkadot"
	    to: 'TChain', // Replace "TChain" with destination Chain, for example "AssetHubPolkadot" or custom location
        currency: { currencySpec }, //{id: currencyID, amount: amount /*Use "ALL" to transfer everything*/} | {symbol: currencySymbol, amount: amount /*Use "ALL" to transfer everything*/} | {symbol: Native('currencySymbol'), amount: amount /*Use "ALL" to transfer everything*/} | {symbol: Foreign('currencySymbol'), amount: amount /*Use "ALL" to transfer everything*/} | {symbol: ForeignAbstract('currencySymbol'), amount: amount /*Use "ALL" to transfer everything*/} | {location: AssetLocationString, amount: amount /*Use "ALL" to transfer everything*/ | AssetLocationJson, amount: amount /*Use "ALL" to transfer everything*/} | {location: Override('Custom location'), amount: amount /*Use "ALL" to transfer everything*/} | [ {currencySelection, isFeeAsset?: true /* for example symbol: symbol or id: id, or location: location*/, amount: amount /*Use "ALL" to transfer everything*/}]
        //feeAsset: {id: currencyID} | {symbol: currencySymbol} | {location: AssetLocationString | AssetLocationJson} //Optional parameter used when multiasset is provided or when origin === AssetHubPolkadot and TX is supposed to be paid in same fee asset as selected currency
        recipient: "Address", // Replace "Address" with destination wallet address (In AccountID32 or AccountKey20 Format)
        sender: "Address" // Replace "Address" with sender wallet address (In AccountID32 or AccountKey20 Format) 
        /*disableFallback: "True" //Optional parameter - if enabled it disables fallback to payment info if dryrun fails only returning dryrun error but no fees.*/
    })
});

//Perform comprehensive transfer info query that will retrieve all details regarding fees and balances that will be changed by performing selected XCM call
const response = await fetch(
  'http://localhost:3001/v1/transfer-info' , {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },  
    from: 'TChain', // Replace "TChain" with sender Chain, for example "Polkadot"
    to: 'TChain', // Replace "TChain" with destination Chain, for example "AssetHubPolkadot" or custom location
    currency: { currencySpec }, //{id: currencyID, amount: amount /*Use "ALL" to transfer everything*/} | {symbol: currencySymbol, amount: amount /*Use "ALL" to transfer everything*/} | {symbol: Native('currencySymbol'), amount: amount /*Use "ALL" to transfer everything*/} | {symbol: Foreign('currencySymbol'), amount: amount /*Use "ALL" to transfer everything*/} | {symbol: ForeignAbstract('currencySymbol'), amount: amount /*Use "ALL" to transfer everything*/} | {location: AssetLocationString, amount: amount /*Use "ALL" to transfer everything*/ | AssetLocationJson, amount: amount /*Use "ALL" to transfer everything*/} | {location: Override('Custom location'), amount: amount /*Use "ALL" to transfer everything*/} | [ {currencySelection, isFeeAsset?: true /* for example symbol: symbol or id: id, or location: location*/, amount: amount /*Use "ALL" to transfer everything*/}]
    //feeAsset: {id: currencyID} | {symbol: currencySymbol} | {location: AssetLocationString | AssetLocationJson} //Optional parameter used when multiasset is provided or when origin === AssetHubPolkadot and TX is supposed to be paid in same fee asset as selected currency
    recipient: 'Address', // Replace "Address" with destination wallet address (In AccountID32 or AccountKey20 Format) or custom location
    sender: 'Address' //Replace "Address" with sender address from origin chain
  }),

//Query maximal transferable balance for specific currency on specific account
const response = await fetch(
  'http://localhost:3001/v1/transferable-amount' , {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },  
    from: 'TChain', // Replace "TChain" with sender Chain, for example "Polkadot"
    to: 'TChain', // Replace "TChain" with destination Chain, for example "AssetHubPolkadot" or custom location
    currency: { currencySpec }, //{id: currencyID, amount: amount /*Use "ALL" to transfer everything*/} | {symbol: currencySymbol, amount: amount /*Use "ALL" to transfer everything*/} | {symbol: Native('currencySymbol'), amount: amount /*Use "ALL" to transfer everything*/} | {symbol: Foreign('currencySymbol'), amount: amount /*Use "ALL" to transfer everything*/} | {symbol: ForeignAbstract('currencySymbol'), amount: amount /*Use "ALL" to transfer everything*/} | {location: AssetLocationString, amount: amount /*Use "ALL" to transfer everything*/ | AssetLocationJson, amount: amount /*Use "ALL" to transfer everything*/} | {location: Override('Custom location'), amount: amount /*Use "ALL" to transfer everything*/} | [ {currencySelection, isFeeAsset?: true /* for example symbol: symbol or id: id, or location: location*/, amount: amount /*Use "ALL" to transfer everything*/}]
    //feeAsset: {id: currencyID} | {symbol: currencySymbol} | {location: AssetLocationString | AssetLocationJson} //Optional parameter used when multiasset is provided or when origin === AssetHubPolkadot and TX is supposed to be paid in same fee asset as selected currency
    recipient: 'Address', // Replace "Address" with destination wallet address (In AccountID32 or AccountKey20 Format) or custom location
    sender: 'Address' //Replace "Address" with sender address from origin chain
  }),

//Query minimal transferable balance for specific currency on specific account
const response = await fetch(
  'http://localhost:3001/v1/min-transferable-amount' , {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },  
    from: 'TChain', // Replace "TChain" with sender Chain, for example "Polkadot"
    to: 'TChain', // Replace "TChain" with destination Chain, for example "AssetHubPolkadot" or custom location
    currency: { currencySpec }, //{id: currencyID, amount: amount /*Use "ALL" to transfer everything*/} | {symbol: currencySymbol, amount: amount /*Use "ALL" to transfer everything*/} | {symbol: Native('currencySymbol'), amount: amount /*Use "ALL" to transfer everything*/} | {symbol: Foreign('currencySymbol'), amount: amount /*Use "ALL" to transfer everything*/} | {symbol: ForeignAbstract('currencySymbol'), amount: amount /*Use "ALL" to transfer everything*/} | {location: AssetLocationString, amount: amount /*Use "ALL" to transfer everything*/ | AssetLocationJson, amount: amount /*Use "ALL" to transfer everything*/} | {location: Override('Custom location'), amount: amount /*Use "ALL" to transfer everything*/} | [ {currencySelection, isFeeAsset?: true /* for example symbol: symbol or id: id, or location: location*/, amount: amount /*Use "ALL" to transfer everything*/}]
    //feeAsset: {id: currencyID} | {symbol: currencySymbol} | {location: AssetLocationString | AssetLocationJson} //Optional parameter used when multiasset is provided or when origin === AssetHubPolkadot and TX is supposed to be paid in same fee asset as selected currency
    recipient: 'Address', // Replace "Address" with destination wallet address (In AccountID32 or AccountKey20 Format) or custom location
    sender: 'Address' //Replace "Address" with sender address from origin chain
  }),

//Retrieve the amount of the currency that will be received on destination.
const response = await fetch(
  'http://localhost:3001/v1/receivable-amount' , {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },  
    from: 'TChain', // Replace "TChain" with sender Chain, for example "Polkadot"
    to: 'TChain', // Replace "TChain" with destination Chain, for example "AssetHubPolkadot" or custom location
    currency: { currencySpec }, //{id: currencyID, amount: amount /*Use "ALL" to transfer everything*/} | {symbol: currencySymbol, amount: amount /*Use "ALL" to transfer everything*/} | {symbol: Native('currencySymbol'), amount: amount /*Use "ALL" to transfer everything*/} | {symbol: Foreign('currencySymbol'), amount: amount /*Use "ALL" to transfer everything*/} | {symbol: ForeignAbstract('currencySymbol'), amount: amount /*Use "ALL" to transfer everything*/} | {location: AssetLocationString, amount: amount /*Use "ALL" to transfer everything*/ | AssetLocationJson, amount: amount /*Use "ALL" to transfer everything*/} | {location: Override('Custom location'), amount: amount /*Use "ALL" to transfer everything*/} | [ {currencySelection, isFeeAsset?: true /* for example symbol: symbol or id: id, or location: location*/, amount: amount /*Use "ALL" to transfer everything*/}]
    //feeAsset: {id: currencyID} | {symbol: currencySymbol} | {location: AssetLocationString | AssetLocationJson} //Optional parameter used when multiasset is provided or when origin === AssetHubPolkadot and TX is supposed to be paid in same fee asset as selected currency
    recipient: 'Address', // Replace "Address" with destination wallet address (In AccountID32 or AccountKey20 Format) or custom location
    sender: 'Address' //Replace "Address" with sender address from origin chain
  }),

//Verify whether the existential deposit will be met when XCM message will be sent to destination chain
const response = await fetch(
  'http://localhost:3001/v1/verify-ed-on-destination' , {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },  
    from: 'TChain', // Replace "TChain" with sender Chain, for example "Polkadot"
    to: 'TChain', // Replace "TChain" with destination Chain, for example "AssetHubPolkadot" or custom location
    currency: { currencySpec }, //{id: currencyID, amount: amount /*Use "ALL" to transfer everything*/} | {symbol: currencySymbol, amount: amount /*Use "ALL" to transfer everything*/} | {symbol: Native('currencySymbol'), amount: amount /*Use "ALL" to transfer everything*/} | {symbol: Foreign('currencySymbol'), amount: amount /*Use "ALL" to transfer everything*/} | {symbol: ForeignAbstract('currencySymbol'), amount: amount /*Use "ALL" to transfer everything*/} | {location: AssetLocationString, amount: amount /*Use "ALL" to transfer everything*/ | AssetLocationJson, amount: amount /*Use "ALL" to transfer everything*/} | {location: Override('Custom location'), amount: amount /*Use "ALL" to transfer everything*/} | [ {currencySelection, isFeeAsset?: true /* for example symbol: symbol or id: id, or location: location*/, amount: amount /*Use "ALL" to transfer everything*/}]
    //feeAsset: {id: currencyID} | {symbol: currencySymbol} | {location: AssetLocationString | AssetLocationJson} //Optional parameter used when multiasset is provided or when origin === AssetHubPolkadot and TX is supposed to be paid in same fee asset as selected currency
    recipient: 'Address', // Replace "Address" with destination wallet address (In AccountID32 or AccountKey20 Format) or custom location
    sender: 'Address' //Replace "Address" with sender address from origin chain
  }),

// Retrieve specific asset balance for specific chain
const response = await fetch("http://localhost:3001/v1/balance/:chain", {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        recipient: "Address", // Replace "Address" with wallet address (In AccountID32 or AccountKey20 Format) 
        currency: {currencySpec}, //{id: currencyID} | {symbol: currencySymbol} | {"symbol": {"type": "Native","value": "currencySymbol"} | {"symbol": {"type": "Foreign","value": "currencySymbol"} | {"symbol": {"type": "ForeignAbstract","value": "currencySymbolAlias"} | {location: AssetLocationString} | {location: AssetLocationJson} | {location: "type": "Override","value": "CustomAssetLocationJson"}
    })
});

// Get best amount out
const response = await fetch(
  'http://localhost:3001/v1/best-amount-out' , {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },  
    from: 'Chain', // Replace "Chain" with sender Chain or Relay chain, e.g., "Acala"
    to: 'Chain', // Replace "Chain" with destination Chain or Relay chain, e.g., "Moonbeam" or custom Location
    currency: { currencySpec }, // Refer to currency spec options above
    recipient: 'Address', // Replace "Address" with destination wallet address (In AccountID32 or AccountKey20 Format) or custom Location
    sender: 'Address', //Replace "Address" with sender address from origin chain
    swapOptions: {
      currencyTo: CURRENCY_SPEC, //Reffer to currency spec options above
      // exchange: ['AssetHubPolkadotDex'], - Optional parameter - 'HydrationDex' | 'AcalaDex' | 'AssetHubPolkadotDex' | ...
      // slippage: 1, - Optional - 1 by default
      // evmsender: '0x000', - Optional parameter when origin CHAIN is EVM based (Required with evmSigner)
    },
}),

// Retrieve existential deposit for specific assets on selected chain
const response = await fetch("http://localhost:3001/v1/balance/:chain/existential-deposit", {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        currency: "Currency" //Replace "Currency" with {id: currencyID} | {symbol: currencySymbol} | {"symbol": {"type": "Native","value": "currencySymbol"} | {"symbol": {"type": "Foreign","value": "currencySymbol"} | {"symbol": {"type": "ForeignAbstract","value": "currencySymbolAlias"} | {location: AssetLocationString} | {location: AssetLocationJson}
    })
});

// Convert SS58 address to Chain specific format
const response = await fetch('http://localhost:3001/v1/convert-ss58?address=:address&chain=:chain');
```

### Asset queries

A complete guide on this section can be found in [official docs](https://paraspell.github.io/docs/xcm-api/xcm-sdk-functionality.html#asset-queries).

Possible parameters:

- `chain`: Specific Chain for example Moonbeam
- `asset`: Asset symbol eg. DOT
- `paraID`: Chain ID for example 2090 (Basilisk)

```ts

// Retrieve Fee asset queries (Assets accepted as XCM Fee on specific chain)
const response = await fetch('http://localhost:3001/v1/assets/:chain/fee-assets');

// Retrieve assets object for a specific Chain
const response = await fetch('http://localhost:3001/v1/assets/:chain');

// Retrieve the Relay chain asset Symbol for a particular Chain
const response = await fetch(
  'http://localhost:3001/v1/assets/:chain/relay-chain-symbol',
);

// Retrieve native assets for a particular Chain
const response = await fetch('http://localhost:3001/v1/assets/:chain/native');

// Retrieve foreign assets for a particular Chain
const response = await fetch('http://localhost:3001/v1/assets/:chain/other');

// Retrieve all asset symbols for particular Chain
const response = await fetch('http://localhost:3001/v1/assets/:chain/all-symbols');

// Retrieve Chain ID for a particular Chain
const response = await fetch('http://localhost:3001/v1/chains/:chain/para-id');

// Retrieve Chain name from Chain ID
const response = await fetch('http://localhost:3001/v1/chains/:paraID?ecosystem=polkadot');

// Retrieve a list of implemented Chains
const response = await fetch('http://localhost:3001/v1/chains');

// Query list of chain WS endpoints
const response = await fetch('http://localhost:3001/v1/chains/:chain/ws-endpoints');

// Query supported assets supported between two chains
const response = await fetch('http://localhost:3001/v1/supported-assets?origin=:chain&destination=:chain');

// Retrieve location for asset id or symbol for specific assets on selected chain
const response = await fetch("http://localhost:3001/v1/assets/:chain/location", {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        currency: "Currency" //Replace "Currency" with {id: currencyID} | {symbol: currencySymbol} | {"symbol": {"type": "Native","value": "currencySymbol"} | {"symbol": {"type": "Foreign","value": "currencySymbol"} | {"symbol": {"type": "ForeignAbstract","value": "currencySymbolAlias"}
    })
});

// Retrieve reserve chain for specific asset on specific chain
const response = await fetch("http://localhost:3001/v1/assets/:chain/reserve-chain", {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        currency: "Currency" //Replace "Currency" with {id: currencyID} | {symbol: currencySymbol} | {"symbol": {"type": "Native","value": "currencySymbol"} | {"symbol": {"type": "Foreign","value": "currencySymbol"} | {"symbol": {"type": "ForeignAbstract","value": "currencySymbolAlias"}
    })
});

// Find out whether asset is registered on chain and return its entire parameters. If not found, returns null.
const response = await fetch("http://localhost:3001/v1/assets/:chain/asset-info", {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        currency: "Currency" //Replace "Currency" with {id: currencyID} | {symbol: currencySymbol} | {"symbol": {"type": "Native","value": "currencySymbol"} | {"symbol": {"type": "Foreign","value": "currencySymbol"} | {"symbol": {"type": "ForeignAbstract","value": "currencySymbolAlias"}
        destination?: "CHAIN"
    })
});

//Get chains that support the specific asset related to origin
const response = await fetch("http://localhost:3001/v1/assets/:chain/supported-destinations", {
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

A complete guide on this section can be found in [official docs](https://paraspell.github.io/docs/xcm-api/xcm-sdk-functionality.html#xcm-pallet-queries).

Possible parameters:

- `chain`: Specific Chain for example Moonbeam

```ts
// Return default pallet for specific Chain
const response = await fetch('http://localhost:3001/v1/pallets/:chain/default');

// Return an array of supported pallets for a specific Chain
const response = await fetch('http://localhost:3001/v1/pallets/:chain');

// Return ID of the specific cross-chain pallet for specific Chain
const response = await fetch('http://localhost:3001/v1/pallets/:chain/index?pallet=XTokens');

// Return Chain support for DryRun
const response = await fetch('http://localhost:3001/v1/chains/:chain/has-dry-run-support');

//Returns all pallets for local transfers of native assets for specific chain.
const response = await fetch('http://localhost:3001/v1/pallets/:chain/native-assets');

//Returns all pallets for local transfers of foreign assets for specific chain.
const response = await fetch('http://localhost:3001/v1/pallets/:chain/other-assets');
```

### XCM Analyser

A complete guide on this section can be found in [official docs](https://paraspell.github.io/docs/xcm-api/xcm-analyser-functionality.html).

```
NOTICE: Only one parameter at a time is allowed, either location or xcm.
```

Possible parameters:

- `location` (Optional): Specific location
- `xcm` (Optional): Complete XCM call

```ts
const response = await fetch('http://localhost:3001/v1/xcm-analyser', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    location: 'location', //Replace location with specific location you wish to analyse
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

#### Upgrading request per minute count - [guide](https://paraspell.github.io/docs/xcm-api/upgrade-xcm-request-amount.html).

#### Deploying API yourself - [guide](https://paraspell.github.io/docs/xcm-api/deploy-api-yourself.html).

## Tests

- Run linter using `pnpm lint`

- Run unit and integration tests using `pnpm test`

- Run end-to-end tests using `pnpm test:e2e`

- Run tests with coverage `pnpm test:cov`

> [!NOTE]
> API can be tested in [Playground](https://github.com/paraspell/xcm-tools/tree/main/apps/playground).


## Contribute to XCM Tools and earn rewards 💰

We run an open Bug Bounty Program that rewards contributors for reporting and fixing bugs in the project. More information on bug bounty can be found in the [official documentation](https://paraspell.github.io/docs/contribution-guidelines.html).

## Get Support 🚑

- Contact form on our [landing page](https://paraspell.xyz/#contact-us).
- Message us on our [X](https://x.com/paraspell).
- Support channel on [telegram](https://t.me/paraspell).

## License

Made with 💛 by [ParaSpell✨](https://github.com/paraspell)

Published under [MIT License](https://github.com/paraspell/xcm-tools/blob/main/apps/xcm-api/LICENSE).
