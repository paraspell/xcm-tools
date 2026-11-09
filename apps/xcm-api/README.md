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

  <p align="center">Now live at https://api.paraspell.xyz/v2</p>

  <p>XCM API downtime monitoring <a href="https://status.paraspell.xyz/">[here]</a></p>
  <p>XCM API documentation <a href="https://paraspell.github.io/docs/xcm-api/getting-started.html">[here]</a></p>
  <p>Generate XCM API starter project <a href="https://paraspell.github.io/docs/paraspell-cli/getting-started.html">[here]</a></p>
</div>
<br /><br />

## Implementation

### Sending XCM

A complete guide on this section can be found in [official docs](https://paraspell.github.io/docs/xcm-api/xcm-sdk-functionality.html).

Possible parameters:

- `from`: (required): Represents the Chain from which the assets will be transferred.
- `to`: (required): Represents the Chain to which the assets will be transferred. This can also be custom location.
- `currency`: (required): Represents the asset(s) being sent, including the amount. See currency spec options below.
- `recipient`: (required): Specifies the address of the recipient. This can also be custom location.
- `sender`: (required): Specifies the address of the sender. Optional (but strongly recommended) for `x-transfer`.
- `feeAsset`: (optional): Specifies the asset used to pay fees on origin. Required when multiple assets are provided in `currency`. See fee asset option below.
- `xcmVersion`: (optional): Specifies manually selected XCM version if pre-selected does not work. Format: Vx - where x = version number eg. V4.

Currency spec options:

```ts
// Asset selection by location (recommended)
{location: AssetLocationString, amount: amount}
{location: AssetLocationJson, amount: amount}

// Asset selection by asset ID (not all chains register assets under IDs)
{id: currencyID, amount: amount}

// Asset selection by asset symbol
{symbol: currencySymbol, amount: amount}
{symbol: {type: 'Native', value: 'currencySymbol'}, amount: amount} // Used when multiple assets under same symbol are registered, this selection will prefer chains native assets
{symbol: {type: 'Foreign', value: 'currencySymbol'}, amount: amount} // Used when multiple assets under same symbol are registered, this selection will prefer chains foreign assets
{symbol: {type: 'ForeignAbstract', value: 'currencySymbol'}, amount: amount} // Used when multiple foreign assets under same symbol are registered, this selection will prefer selected abstract asset (They are given as option when error is displayed)

// Asset selection of multiple assets - requires feeAsset parameter
[{currencySelection, amount: amount}, {currencySelection, amount: amount}, ...] // currencySelection is any selection above without amount, for example symbol: symbol or id: id, or location: location

// amount - positive number or numeric string. Decimals are abstracted by default, so 1 equals 10_000_000_000 if selected asset is DOT (disable with options.abstractDecimals: false)
```

Fee asset option:

```ts
// Used when multiple assets are provided (required - must be one of the provided assets) or when (origin === AssetHubPolkadot | Hydration) - This will allow for custom fee asset on origin.
feeAsset: {id: currencyID} | {symbol: currencySymbol} | {location: AssetLocationString | AssetLocationJson}

// Example - transfer of multiple assets where DOT pays the fees
currency: [{symbol: 'USDT', amount: '10'}, {symbol: 'DOT', amount: '1'}],
feeAsset: {symbol: 'DOT'}
```

```ts
//Construct XCM call from Substrate to Substrate
const response = await fetch('https://api.paraspell.xyz/v2/x-transfer', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from: 'TChain', // Replace "TChain" with sender Chain, for example "Polkadot"
    to: 'TChain', // Replace "TChain" with destination Chain, for example "AssetHubPolkadot" or custom location
    currency: { currencySpec }, // Refer to currency spec options above
    recipient: 'Address', // Replace "Address" with destination wallet address (In AccountID32 or AccountKey20 Format) or custom location
    sender: 'Address', // Optional but strongly recommended as it is automatically ignored when not needed - Used when origin is AssetHub with feeAsset or when sending to AssetHub to prevent asset traps by auto-swapping to DOT to have DOT ED.
    //feeAsset: { currencySelection }, // Optional parameter - Refer to fee asset option above
    //xcmVersion: 'Vx', // Optional parameter - replace "Vx" with V and version number eg. "V4"
    //pallet: 'RandomXTokens', // Optional parameter - replace RandomXTokens with Camel case name of the pallet
    //method: 'random_function', // Optional parameter - replace random_function with snake case name of the method
    //ahAddress: 'Address', // Optional parameter - used when origin is EVM chain and XCM goes through AssetHub (Multihop transfer where we are unable to convert Key20 to ID32 address)
  }),
});

//Construct local asset transfer
const response = await fetch('https://api.paraspell.xyz/v2/x-transfer', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from: 'TChain', // Replace "TChain" with sender Chain, for example "Polkadot"
    to: 'TChain', // Replace "TChain" with same parameter as "from" parameter
    currency: { currencySpec }, // Refer to currency spec options above
    recipient: 'Address', // Replace "Address" with destination wallet address (In AccountID32 or AccountKey20 Format) or custom location
    //keepAlive: false, // Optional parameter - true by default (keeps the sender account above existential deposit). Set to false to allow draining the account below existential deposit
  }),
});

//Transact call
const response = await fetch('https://api.paraspell.xyz/v2/x-transfer', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from: 'Chain', // Replace "Chain" with sender Chain, e.g., "Acala"
    to: 'Chain', // Replace "Chain" with destination Chain, e.g., "Hydration"
    currency: { currencySpec }, // Refer to currency spec options above
    recipient: 'Address', // Replace "Address" with destination wallet address (In AccountID32 or AccountKey20 Format) or custom Location
    sender: 'Address', // Replace "Address" with sender wallet address (In AccountID32 or AccountKey20 Format)
    transactOptions: {
      call: 'Hex', // Replace "Hex" with hex of the call that should execute on destination
      /*originKind: 'SovereignAccount' | 'Xcm' | 'Native' | 'Superuser' - Optional, 'SovereignAccount' by default
      maxWeight: { proofSize: string, refTime: string } - Optional, autofilled by default (Utilized in V3 and V4 as maxFallbackWeight parameter)*/
    },
  }),
});

//Swap call
const response = await fetch('https://api.paraspell.xyz/v2/x-transfers', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from: 'Chain', // Replace "Chain" with sender Chain, e.g., "Acala"
    to: 'Chain', // Replace "Chain" with destination Chain, e.g., "Hydration"
    currency: { currencySpec }, // Refer to currency spec options above
    recipient: 'Address', // Replace "Address" with destination wallet address (In AccountID32 or AccountKey20 Format) or custom Location
    sender: 'Address', // Replace "Address" with sender wallet address (In AccountID32 or AccountKey20 Format)
    swapOptions: {
      currencyTo: { currencySelection }, // Currency to receive - Refer to currency spec options above (without amount)
      // exchange: ['Hydration', 'AssetHubPolkadot'], - Optional parameter - single exchange or array of exchanges - 'AssetHubPolkadot' | 'AssetHubKusama' | 'AssetHubPaseo' | 'AssetHubWestend' | 'Hydration' | 'Acala' | 'Karura' | 'BifrostPolkadot' | 'BifrostKusama'. Selected automatically by best outcome when not provided
      // slippage: 1, - Optional - 1 by default
      // evmSenderAddress: '0x000', - Optional parameter when origin chain is EVM based
    },
  }),
});

//Sending EVM XCM transfer https://paraspell.github.io/docs/xcm-api/xcm-sdk-functionality.html#sending-evm-xcm
const response = await fetch('https://api.paraspell.xyz/v2/evm-x-transfer', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from: 'TChain', // Replace "TChain" with sender EVM Chain, for example "Ethereum" or "Darwinia"
    to: 'TChain', // Replace "TChain" with destination Chain, for example "Hydration" or custom Location
    currency: { currencySpec }, // Refer to currency spec options above
    recipient: 'Address', // Replace "Address" with destination wallet address (In AccountID32 or AccountKey20 Format) or custom Location
    sender: 'Address', // Replace "Address" with sender EVM address
  }),
});

//DryRun your XCM calls to find whether they will execute
const response = await fetch('https://api.paraspell.xyz/v2/dry-run', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from: 'TChain', // Replace "TChain" with sender Chain, for example "Polkadot"
    to: 'TChain', // Replace "TChain" with destination Chain, for example "AssetHubPolkadot" or custom location
    currency: { currencySpec }, // Refer to currency spec options above
    recipient: 'Address', // Replace "Address" with destination wallet address (In AccountID32 or AccountKey20 Format) or custom location
    sender: 'Address', // Replace "Address" with sender address from origin chain
    //feeAsset: { currencySelection }, // Optional parameter - Refer to fee asset option above
    //swapOptions: { currencyTo: { currencySelection } }, // Optional parameter - Dry run of swap transfer, same as in Swap call
  }),
});

//Preview dryrun result of different amount than you currently have
const response = await fetch('https://api.paraspell.xyz/v2/dry-run-preview', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from: 'TChain', // Replace "TChain" with sender Chain, for example "Polkadot"
    to: 'TChain', // Replace "TChain" with destination Chain, for example "AssetHubPolkadot" or custom location
    currency: { currencySpec }, // Refer to currency spec options above
    recipient: 'Address', // Replace "Address" with destination wallet address (In AccountID32 or AccountKey20 Format) or custom location
    sender: 'Address', // Replace "Address" with sender address from origin chain
    //feeAsset: { currencySelection }, // Optional parameter - Refer to fee asset option above
    //options: { mintFeeAssets: true }, // Optional parameter - false by default - Mints fee assets also, if user does not have enough to cover fees on origin
  }),
});

//Query Snowbridge (Polkadot <> Ethereum bridge) status
const response = await fetch('https://api.paraspell.xyz/v2/x-transfer/eth-bridge-status');

//Construct custom batch of XCM Calls
const response = await fetch('https://api.paraspell.xyz/v2/x-transfer-batch', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    transfers, // Replace "transfers" with array of XCM transfers (same body as in x-transfer, without options)
    //options: { mode: 'BATCH' }, // Optional parameter - 'BATCH' | 'BATCH_ALL' - BATCH_ALL by default
  }),
});

```

### Adding chain and/or assets
A complete guide on this section can be found in [official docs](https://paraspell.github.io/docs/xcm-api/xcm-sdk-functionality.html#adding-chain-and-or-assets).

Possible parameters:
- Inherited from concrete endpoint

```ts
const response = await fetch("https://api.paraspell.xyz/v2/x-transfer", {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
    
    // Custom chains can be fitted into both from and to parameters
    "from": "MyChain", 
    "to": "AssetHubPolkadot",
    "recipient": "address",
    "currency": { "symbol": "USDC", "amount": "1000000" },
    "options": {

      // Adding custom chain
      "customChains": {
        "MyChain": {
          "paraId": 4242,
          "ecosystem": "Polkadot",
          "xcmVersion": "V5",
          "providers": [
            { "name": "Primary", "endpoint": "wss://rpc.mychain.example/ws" } // Only wss:// endpoints are accepted
          ],
          // Everything below is optional — auto-fetched from runtime `system.properties` when omitted
          "nativeAssetSymbol": "MYC",
          "nativeAssetDecimals": 12,
          "ss58Prefix": 42,
          "pallets": {
              "nativeAssets": "Balances",
              "otherAssets": ["Assets"],
          },
          "assets": [
            {
              "symbol": "USDC",
              "decimals": 6,
              "assetId": "1337",
              "existentialDeposit": "10000000", //Needs to be in planck
              "location": {
                "parents": 1,
                "interior": {
                  "X3": [
                    { "Parachain": 1000 },
                    { "PalletInstance": 50 },
                    { "GeneralIndex": 1337 }
                  ]
                }
              }
            }
          ]
        }
      },

      // Adding assets to existing chains
      "customAssets": {
        "AssetHubPolkadot": [
          {
            "symbol": "MYNEWUSD",
            "decimals": 6,
            "assetId": "9999",
            "existentialDeposit": "10000000", //Needs to be in planck
            "location": {
              "parents": 0,
              "interior": {
                "X2": [{ "PalletInstance": 50 }, { "GeneralIndex": 9999 }]
              }
            }
          },
          // Replace an existing registry asset that shares the same location
          {
            "symbol": "USDT",
            "decimals": 6,
            "assetId": "1984",
            "existentialDeposit": "10000000", //Needs to be in planck
            "location": {
              "parents": 0,
              "interior": {
                "X2": [{ "PalletInstance": 50 }, { "GeneralIndex": 1984 }]
              }
            },
            "forceOverride": true
          }
        ]
      }
    }
  })
});
```

### Localhost testing setup

A complete guide on this section can be found in [official docs](https://paraspell.github.io/docs/xcm-api/xcm-sdk-functionality.html#localhost-testing-setup).

Possible parameters:
- Inherited from concrete endpoint

```ts
const response = await fetch("https://api.paraspell.xyz/v2/x-transfer", {
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
          abstractDecimals: true, // TRUE BY DEFAULT Abstracts decimals, so 1 as input amount equals 10_000_000_000 if selected asset is DOT
          xcmFormatCheck: true, // Dryruns each call under the hood with dryrun bypass to confirm message passes with fictional balance
          apiOverrides: { // Only wss:// endpoints are accepted - single endpoint or array of endpoints per chain
            Hydration: "wss://hydration.ibp.network",
            AssetHubPolkadot: "wss://dot-rpc.stakeworld.io/assethub",
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
const response = await fetch("https://api.paraspell.xyz/v2/sign-and-submit", {
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
          abstractDecimals: true, // TRUE BY DEFAULT Abstracts decimals, so 1 as input amount equals 10_000_000_000 if selected asset is DOT
          xcmFormatCheck: true, // Dryruns each call under the hood with dryrun bypass to confirm message passes with fictional balance
          apiOverrides: { // Only wss:// endpoints are accepted
            Hydration: "wss://127.0.0.1:8000", //Locally launched chain (Eg. chopsticks) exposed over wss://
            Moonbeam: "wss://127.0.0.1:8001" //Locally launched chain (Eg. chopsticks) exposed over wss://
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
- `currency`: (required): Represents the asset(s) being sent, including the amount. Refer to currency spec options above.
- `recipient`: (required): Specifies the address of the recipient. This can also be custom location.
- `sender`: (required): Specifies the address of the sender.
- `feeAsset`: (optional): Specifies the asset used to pay fees on origin. Refer to fee asset option above.
- `swapOptions`: (optional): Specifies the swap that should occur during XCM, same as in Swap call. Required for `best-amount-out`.
- `disableFallback`: (optional): Only for `xcm-fee` - if `true`, disables fallback to payment info if dryrun fails, only returning dryrun error but no fees.

```ts
//XCM Fee (Origin & Destination)
const response = await fetch("https://api.paraspell.xyz/v2/xcm-fee", {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        from: 'TChain', // Replace "TChain" with sender Chain, for example "Polkadot"
        to: 'TChain', // Replace "TChain" with destination Chain, for example "AssetHubPolkadot" or custom location
        currency: { currencySpec }, // Refer to currency spec options above
        recipient: "Address", // Replace "Address" with destination wallet address (In AccountID32 or AccountKey20 Format)
        sender: "Address", // Replace "Address" with sender wallet address (In AccountID32 or AccountKey20 Format)
        //feeAsset: { currencySelection }, // Optional parameter - Refer to fee asset option above
        //disableFallback: true, // Optional parameter - if enabled it disables fallback to payment info if dryrun fails only returning dryrun error but no fees.
    })
});

//XCM Fee (Origin)
const response = await fetch("https://api.paraspell.xyz/v2/origin-xcm-fee", {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        from: 'TChain', // Replace "TChain" with sender Chain, for example "Polkadot"
        to: 'TChain', // Replace "TChain" with destination Chain, for example "AssetHubPolkadot" or custom location
        currency: { currencySpec }, // Refer to currency spec options above
        recipient: "Address", // Replace "Address" with destination wallet address (In AccountID32 or AccountKey20 Format)
        sender: "Address", // Replace "Address" with sender wallet address (In AccountID32 or AccountKey20 Format)
        //feeAsset: { currencySelection }, // Optional parameter - Refer to fee asset option above
    })
});

//Perform comprehensive transfer info query that will retrieve all details regarding fees and balances that will be changed by performing selected XCM call
const response = await fetch('https://api.paraspell.xyz/v2/transfer-info', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from: 'TChain', // Replace "TChain" with sender Chain, for example "Polkadot"
    to: 'TChain', // Replace "TChain" with destination Chain, for example "AssetHubPolkadot" or custom location
    currency: { currencySpec }, // Refer to currency spec options above
    recipient: 'Address', // Replace "Address" with destination wallet address (In AccountID32 or AccountKey20 Format) or custom location
    sender: 'Address', // Replace "Address" with sender address from origin chain
    //feeAsset: { currencySelection }, // Optional parameter - Refer to fee asset option above
  }),
});

//Query maximal transferable balance for specific currency on specific account
const response = await fetch('https://api.paraspell.xyz/v2/transferable-amount', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from: 'TChain', // Replace "TChain" with sender Chain, for example "Polkadot"
    to: 'TChain', // Replace "TChain" with destination Chain, for example "AssetHubPolkadot" or custom location
    currency: { currencySpec }, // Refer to currency spec options above
    recipient: 'Address', // Replace "Address" with destination wallet address (In AccountID32 or AccountKey20 Format) or custom location
    sender: 'Address', // Replace "Address" with sender address from origin chain
    //feeAsset: { currencySelection }, // Optional parameter - Refer to fee asset option above
  }),
});

//Query minimal transferable balance for specific currency on specific account
const response = await fetch('https://api.paraspell.xyz/v2/min-transferable-amount', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from: 'TChain', // Replace "TChain" with sender Chain, for example "Polkadot"
    to: 'TChain', // Replace "TChain" with destination Chain, for example "AssetHubPolkadot" or custom location
    currency: { currencySpec }, // Refer to currency spec options above
    recipient: 'Address', // Replace "Address" with destination wallet address (In AccountID32 or AccountKey20 Format) or custom location
    sender: 'Address', // Replace "Address" with sender address from origin chain
    //feeAsset: { currencySelection }, // Optional parameter - Refer to fee asset option above
  }),
});

//Retrieve the amount of the currency that will be received on destination.
const response = await fetch('https://api.paraspell.xyz/v2/receivable-amount', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from: 'TChain', // Replace "TChain" with sender Chain, for example "Polkadot"
    to: 'TChain', // Replace "TChain" with destination Chain, for example "AssetHubPolkadot" or custom location
    currency: { currencySpec }, // Refer to currency spec options above
    recipient: 'Address', // Replace "Address" with destination wallet address (In AccountID32 or AccountKey20 Format) or custom location
    sender: 'Address', // Replace "Address" with sender address from origin chain
    //feeAsset: { currencySelection }, // Optional parameter - Refer to fee asset option above
  }),
});

//Verify whether the existential deposit will be met when XCM message will be sent to destination chain
const response = await fetch('https://api.paraspell.xyz/v2/verify-ed-on-destination', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from: 'TChain', // Replace "TChain" with sender Chain, for example "Polkadot"
    to: 'TChain', // Replace "TChain" with destination Chain, for example "AssetHubPolkadot" or custom location
    currency: { currencySpec }, // Refer to currency spec options above
    recipient: 'Address', // Replace "Address" with destination wallet address (In AccountID32 or AccountKey20 Format) or custom location
    sender: 'Address', // Replace "Address" with sender address from origin chain
    //feeAsset: { currencySelection }, // Optional parameter - Refer to fee asset option above
  }),
});

// Retrieve specific asset balance for specific chain
const response = await fetch("https://api.paraspell.xyz/v2/balance/:chain", {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        address: "Address", // Replace "Address" with wallet address (In AccountID32 or AccountKey20 Format)
        currency: { currencySelection }, // Refer to currency spec options above (without amount) - Optional, native asset of the chain is used when not provided
    })
});

// Get best amount out
const response = await fetch('https://api.paraspell.xyz/v2/best-amount-out', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from: 'Chain', // Replace "Chain" with sender Chain or Relay chain, e.g., "Acala"
    to: 'Chain', // Replace "Chain" with destination Chain or Relay chain, e.g., "Moonbeam" or custom Location
    currency: { currencySpec }, // Refer to currency spec options above
    recipient: 'Address', // Replace "Address" with destination wallet address (In AccountID32 or AccountKey20 Format) or custom Location
    sender: 'Address', // Replace "Address" with sender address from origin chain
    swapOptions: {
      currencyTo: { currencySelection }, // Currency to receive - Refer to currency spec options above (without amount)
      // exchange: ['Hydration'], - Optional parameter - 'Hydration' | 'Acala' | 'AssetHubPolkadot' | ...
      // slippage: 1, - Optional - 1 by default
      // evmSenderAddress: '0x000', - Optional parameter when origin chain is EVM based
    },
    //feeAsset: { currencySelection }, // Optional parameter - Refer to fee asset option above
  }),
});

// Retrieve existential deposit for specific assets on selected chain
const response = await fetch("https://api.paraspell.xyz/v2/balance/:chain/existential-deposit", {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        currency: { currencySelection } // Refer to currency spec options above (without amount) - Optional, native asset of the chain is used when not provided
    })
});

// Convert SS58 address to Chain specific format
const response = await fetch('https://api.paraspell.xyz/v2/convert-ss58?address=:address&chain=:chain');
```

### Swap helper queries
A complete guide on this section can be found in [official docs](https://paraspell.github.io/docs/xcm-api/xcm-sdk-functionality.html#swap-helper-queries).

Possible parameters:

- `from`: (query parameter): Optional - origin chain.
- `to`: (query parameter): Optional - destination chain.
- `exchange`: (query parameter): Optional - exchange chain (array of them or standalone).

```ts
// Get list of exchange chains
const response = await fetch('https://api.paraspell.xyz/v2/swap/exchange-chains');

// Get list of possible assets to exchange from
const response = await fetch('https://api.paraspell.xyz/v2/swap/supported-assets-from?from=:chain&exchange=:exchange');

// Get list of possible assets to exchange to
const response = await fetch('https://api.paraspell.xyz/v2/swap/supported-assets-to?exchange=:exchange&to=:chain');
```

### Asset queries

A complete guide on this section can be found in [official docs](https://paraspell.github.io/docs/xcm-api/xcm-sdk-functionality.html#asset-queries).

Possible parameters:

- `chain`: Specific Chain for example Moonbeam
- `paraId`: Chain ID for example 2090 (Basilisk)
- `ecosystem`: Ecosystem of the Chain ID - Polkadot | Kusama | Westend | Paseo
- `currency`: (body parameter): Asset selection without amount - Refer to currency spec options above

```ts

// Retrieve Fee asset queries (Assets accepted as XCM Fee on specific chain)
const response = await fetch('https://api.paraspell.xyz/v2/assets/:chain/fee-assets');

// Retrieve assets object for a specific Chain
const response = await fetch('https://api.paraspell.xyz/v2/assets/:chain');

// Retrieve the Relay chain asset Symbol for a particular Chain
const response = await fetch(
  'https://api.paraspell.xyz/v2/assets/:chain/relay-chain-symbol',
);

// Retrieve native assets for a particular Chain
const response = await fetch('https://api.paraspell.xyz/v2/assets/:chain/native');

// Retrieve foreign assets for a particular Chain
const response = await fetch('https://api.paraspell.xyz/v2/assets/:chain/other');

// Retrieve all asset symbols for particular Chain
const response = await fetch('https://api.paraspell.xyz/v2/assets/:chain/all-symbols');

// Retrieve Chain ID for a particular Chain
const response = await fetch('https://api.paraspell.xyz/v2/chains/:chain/para-id');

// Retrieve Chain name from Chain ID
const response = await fetch('https://api.paraspell.xyz/v2/chains/:paraId?ecosystem=Polkadot');

// Retrieve a list of implemented Chains
const response = await fetch('https://api.paraspell.xyz/v2/chains');

// Query list of chain WS endpoints
const response = await fetch('https://api.paraspell.xyz/v2/chains/:chain/ws-endpoints');

// Query supported assets supported between two chains
const response = await fetch('https://api.paraspell.xyz/v2/supported-assets?origin=:chain&destination=:chain');

// Retrieve location for asset id or symbol for specific assets on selected chain
const response = await fetch("https://api.paraspell.xyz/v2/assets/:chain/location", {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        currency: { currencySelection } // Refer to currency spec options above (without amount)
    })
});

// Retrieve reserve chain for specific asset on specific chain
const response = await fetch("https://api.paraspell.xyz/v2/assets/:chain/reserve-chain", {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        currency: { currencySelection } // Refer to currency spec options above (without amount)
    })
});

// Find out whether asset is registered on chain and return its entire parameters. If not found, returns null.
const response = await fetch("https://api.paraspell.xyz/v2/assets/:chain/asset-info", {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        currency: { currencySelection }, // Refer to currency spec options above (without amount)
        //destination: "Chain" // Optional parameter - Replace "Chain" with destination Chain (used when Ethereum is chosen as destination)
    })
});

//Get chains that support the specific asset related to origin
const response = await fetch("https://api.paraspell.xyz/v2/assets/:chain/supported-destinations", {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        currency: { currencySelection } // Refer to currency spec options above (without amount)
    })
});
```

### XCM Pallet queries

A complete guide on this section can be found in [official docs](https://paraspell.github.io/docs/xcm-api/xcm-sdk-functionality.html#xcm-pallet-queries).

Possible parameters:

- `chain`: Specific Chain for example Moonbeam

```ts
// Return default pallet for specific Chain
const response = await fetch('https://api.paraspell.xyz/v2/pallets/:chain/default');

// Return an array of supported pallets for a specific Chain
const response = await fetch('https://api.paraspell.xyz/v2/pallets/:chain');

// Return ID of the specific cross-chain pallet for specific Chain
const response = await fetch('https://api.paraspell.xyz/v2/pallets/:chain/index?pallet=XTokens');

// Return Chain support for DryRun
const response = await fetch('https://api.paraspell.xyz/v2/chains/:chain/has-dry-run-support');

// Returns a JSON array of true EVM compatible chains (Chains that support only substrate EVM are not included.)
const response = await fetch('https://api.paraspell.xyz/v2/chains/evm');

//Returns all pallets for local transfers of native assets for specific chain.
const response = await fetch('https://api.paraspell.xyz/v2/pallets/:chain/native-assets');

//Returns all pallets for local transfers of foreign assets for specific chain.
const response = await fetch('https://api.paraspell.xyz/v2/pallets/:chain/other-assets');
```

### XCM Analyser

A complete guide on this section can be found in [official docs](https://paraspell.github.io/docs/xcm-api/xcm-analyser-functionality.html).

```
NOTICE: Only one parameter at a time is allowed, either location or xcm.
```

Possible parameters:

- `location` (Optional): Specific location (JSON object)
- `xcm` (Optional): Complete XCM call (JSON array)

```ts
const response = await fetch('https://api.paraspell.xyz/v2/xcm-analyser', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    location: Location, //Replace Location with specific location you wish to analyse
    //xcm: XCM, //Or replace XCM with the specific XCM call you wish to analyse
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
