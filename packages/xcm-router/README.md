<br /><br />

<div align="center">
  <h1 align="center">@paraspell/xcm-router</h1>
  <h4 align="center"> Tool for XCM cross-chain asset exchanging across Polkadot and Kusama ecosystems. </h4>
  <p align="center">
    <a href="https://npmjs.com/package/@paraspell/xcm-router">
      <img alt="version" src="https://img.shields.io/npm/v/@paraspell/xcm-router?style=flat-square" />
    </a>
    <a href="https://npmjs.com/package/@paraspell/xcm-router">
      <img alt="downloads" src="https://img.shields.io/npm/dm/@paraspell/xcm-router?style=flat-square" />
    </a>
    <a href="https://github.com/paraspell/xcm-sdk/actions">
      <img alt="build" src="https://github.com/paraspell/xcm-tools/actions/workflows/ci.yml/badge.svg" />
    </a>
  </p>
  <p>XCM Router documentation <a href = "https://paraspell.github.io/docs/router/getting-strtd" \>[here]</p>
    <p>XCM Router starter template project <a href = "https://github.com/paraspell/xcm-router-template" \>[here]</p>
</div>

<br /><br />
<br /><br />

**Implemented exchanges**
| Swap Type   | DEX               | Pools | Notes                                |
|------------|-------------------|-------|--------------------------------------|
| One-click  | Hydration         | 210   | —                                    |
| One-click  | AssetHub Polkadot | 32    | Requires specific native tokens      |
| Two-click  | Acala             | 36    | Requires native token                                    |
| Two-click  | Basilisk          | 15    | —                                    |
| Two-click  | Bifrost Kusama    | 66    | Requires native token                |
| Two-click  | Bifrost Polkadot  | 45    | Requires native token                |
| Two-click  | Karura            | 136   | Requires native token                                    |
| Two-click  | AssetHub Kusama   | 16    | Requires specific native tokens      |

**Total pools available:** 556

> [!NOTE]
> - 📣 Some exchanges require native tokens to proceed with swaps.
>
>- 📣 Router supports one-click cross-chain swaps! Supported exchanges are AssetHubPolkadot and Hydration.
>   - 📋 **Sidenote**: Not all chains can be selected as origin for one-click cross-chain swaps, because their barrier doesn't support execute extrinsic. All chains can be selected as a destination, however. For origin chains that do not support execute extrinsic, we automatically default to the original two-click scenario.


# Installation
#### Install dependencies

> [!IMPORTANT]
> - ⚠️  **WebAssembly (Wasm) must be enabled in your project** because of the Hydration SDK (One of the exchanges implemented in XCM Router). Wasm can be enabled either through the web application configuration or through the appropriate plugin. Additionally, Hydration requires the use of the **augment package** (see: https://github.com/galacticcouncil/sdk/issues/114).
>
> - ⚠️  **XCM Router has been migrated to the PAPI library.** If you used XCM Router prior to migration, replace the legacy Polkadot.js (PJS) injector with the PAPI signer and install the newly required peer dependency. Follow the setup guide for more information.

```bash
yarn add || pnpm | npm install polkadot-api
```

#### Install XCM Router
```bash
yarn add || pnpm | npm install @paraspell/xcm-router
```

## Importing package to your project

Builder:
```ts
import { RouterBuilder } from '@paraspell/xcm-router'
```
Other exposed functions/ways:
```js
// ESM
import * as xcmRouter from '@paraspell/xcm-router'

//Multiple import options
import { transfer, 
         TransactionType, 
         TTransferOptions, 
         TTxProgressInfo } from '@paraspell/xcm-router'

//As Polkadot moves to ESM only, our Router also moves to ESM only. CJS is not supported anymore.
```

# Implementation

## Automatic exchange selection (Based on best price)

If you wish to have an exchange chain selection based on the best price outcome, you can opt for an automatic exchange selection method. This method can be selected by **not using** the `.exchange()` parameter in the call. The router will then automatically select the best exchange chain for you based on the best price outcome. You can find out more in [official documentation](https://paraspell.github.io/docs/router/router-use.html#automatic-exchange-selection).

 ```js
await RouterBuilder(/*builder config - optional (More info in docs)*/)
        .from(TSubstrateChain)   //Origin Parachain/Relay chain - OPTIONAL PARAMETER
        .to(TChain)    //Destination Parachain/Relay chain - OPTIONAL PARAMETER
        .currencyFrom(currencyFrom)    // Currency to send {id: currencyID, amount: amount} | {symbol: currencySymbol, amount: amount} | {symbol: Native('currencySymbol'), amount: amount} | {symbol: Foreign('currencySymbol'), amount: amount} | {symbol: ForeignAbstract('currencySymbol'), amount: amount} | {location: AssetLocationString, amount: amount | AssetLocationJson, amount: amount}
        .currencyTo(currencyTo)    // Currency to receive {id: currencyID, amount: amount} | {symbol: currencySymbol, amount: amount} | {symbol: Native('currencySymbol'), amount: amount} | {symbol: Foreign('currencySymbol'), amount: amount} | {symbol: ForeignAbstract('currencySymbol'), amount: amount} | {location: AssetLocationString, amount: amount | AssetLocationJson, amount: amount}
        .amount(amount)  // Amount to send
        .slippagePct(pct)   // Max slipppage percentage
        .senderAddress(injectorAddress)   //Injector address
        .recipientAddress(recipientAddress) //Recipient address
        .signer(signer)    //PAPI Signer
        //.evmSenderAddress(evmInjector address)   //Optional parameters when origin chain is EVM based (Required with evmSigner)
        //.evmSigner(EVM signer)                     //Optional parameters when origin chain is EVM based (Required with evmInjectorAddress)

        .onStatusChange((status: TRouterEvent) => {  //This is how we subscribe to calls that need signing
          console.log(status.type);   // Current transaction type
          console.log(status.routerPlan);   // Array of all transactions to execute
          console.log(status.chain);   // Current transaction origin chain
          console.log(status.destinationChain);    // Current transaction destination chain
          console.log(status.currentStep);    // 0-based step index of current transaction
        })
        .buildAndSend()
```

## Whitelist exchange selection

If you wish to have specific exchanges selection and select the best one among them based on the best price outcome, you can opt for the whitelist automatic exchange selection method. This method can be selected by **using** `.exchange()` parameter in the call and feeding it with **array of exchanges**. The router will then automatically select the best exchange chain for you based on the best price outcome. You can find out more in [official documentation](https://paraspell.github.io/docs/router/router-use.html#whitelist-exchange-selection).

```ts
await RouterBuilder(/*builder config - optional (More info in docs)*/)
        .from(TSubstrateChain)   //Origin Parachain/Relay chain - OPTIONAL PARAMETER
        .to(TChain)    //Destination Parachain/Relay chain - OPTIONAL PARAMETER
        .exchange(['HydrationDex','AcalaDex','AssetHubPolkadotDex'])    //Exchange Parachains
        .currencyFrom(currencyFrom)    // Currency to send {id: currencyID, amount: amount} | {symbol: currencySymbol, amount: amount} | {symbol: Native('currencySymbol'), amount: amount} | {symbol: Foreign('currencySymbol'), amount: amount} | {symbol: ForeignAbstract('currencySymbol'), amount: amount} | {location: AssetLocationString, amount: amount | AssetLocationJson, amount: amount}
        .currencyTo(currencyTo)    // Currency to receive {id: currencyID, amount: amount} | {symbol: currencySymbol, amount: amount} | {symbol: Native('currencySymbol'), amount: amount} | {symbol: Foreign('currencySymbol'), amount: amount} | {symbol: ForeignAbstract('currencySymbol'), amount: amount} | {location: AssetLocationString, amount: amount | AssetLocationJson, amount: amount}
        .amount(amount)  // Amount to send
        .slippagePct(pct)   // Max slipppage percentage
        .senderAddress(selectedAccount.address)   //Injector address
        .recipientAddress(recipientAddress) //Recipient address
        .signer(signer)    //PAPI Signer
        //.evmSenderAddress(evmInjector address)   //Optional parameters when origin chain is EVM based (Required with evmSigner)
        //.evmSigner(EVM signer)                     //Optional parameters when origin chain is EVM based (Required with evmInjectorAddress)

        .onStatusChange((status: TRouterEvent) => {  //This is how we subscribe to calls that need signing
          console.log(status.type);   // Current transaction type
          console.log(status.routerPlan);   // Array of all transactions to execute
          console.log(status.chain);   // Current transaction origin chain
          console.log(status.destinationChain);    // Current transaction destination chain
          console.log(status.currentStep);    // 0-based step index of current transaction
        })
        .buildAndSend()
```

## Manual exchange selection

If you wish to select your exchange chain manually, you can provide the additional `.exchange()` parameter to the call. The router will then use the exchange chain of your choice. You can find out more in [official documentation](https://paraspell.github.io/docs/router/router-use.html#manual-exchange-selection).

 ```js
await RouterBuilder(/*builder config - optional (More info in docs)*/)
        .from(TSubstrateChain)   //Origin Parachain/Relay chain - OPTIONAL PARAMETER
        .to(TChain)    //Destination Parachain/Relay chain - OPTIONAL PARAMETER
        .exchange(exchange)    //Exchange Parachain
        .currencyFrom(currencyFrom)    // Currency to send {id: currencyID, amount: amount} | {symbol: currencySymbol, amount: amount} | {symbol: Native('currencySymbol'), amount: amount} | {symbol: Foreign('currencySymbol'), amount: amount} | {symbol: ForeignAbstract('currencySymbol'), amount: amount} | {location: AssetLocationString, amount: amount | AssetLocationJson, amount: amount}
        .currencyTo(currencyTo)    // Currency to receive {id: currencyID, amount: amount} | {symbol: currencySymbol, amount: amount} | {symbol: Native('currencySymbol'), amount: amount} | {symbol: Foreign('currencySymbol'), amount: amount} | {symbol: ForeignAbstract('currencySymbol'), amount: amount} | {location: AssetLocationString, amount: amount | AssetLocationJson, amount: amount}
        .amount(amount)  // Amount to send
        .slippagePct(pct)   // Max slipppage percentage
        .senderAddress(selectedAccount.address)   //Injector address
        .recipientAddress(recipientAddress) //Recipient address
        .signer(signer)    //PAPI Signer
        //.evmSignerAddress(evmInjector address)   //Optional parameters when origin chain is EVM based (Required with evmSigner)
        //.evmSigner(EVM signer)                     //Optional parameters when origin chain is EVM based (Required with evmInjectorAddress)

        .onStatusChange((status: TRouterEvent) => {  //This is how we subscribe to calls that need signing
          console.log(status.type);   // Current transaction type
          console.log(status.routerPlan);   // Array of all transactions to execute
          console.log(status.chain);   // Current transaction origin chain
          console.log(status.destinationChain);    // Current transaction destination chain
          console.log(status.currentStep);    // 0-based step index of current transaction
        })
        .buildAndSend()
```

## Get amount out for your currency pair

To retrieve exchange amount, that you receive for your desired asset pair you can use following function. This function returns 2 parameters. Name of best fitting DEX (Automatic selection - can be further used for manual selection) and Amount out. You can find out more in [official documentation](https://paraspell.github.io/docs/router/router-use.html#get-amount-out-for-your-currency-pair).

```ts
const result = await RouterBuilder(/*builder config - optional (More info in docs)*/)
      .from(TSubstrateChain) //Optional parameter based on scenario
      .to(TChain) //Optional parameter based on scenario
      .exchange(exchange) //Optional parameter based on scenario
      .currencyFrom(currencyFrom)
      .currencyTo(currencyTo)
      .amount(amount)
      .getBestAmountOut();

console.log(result.amountOut)
console.log(result.exchange)
```

## Get Router fees

You can retrieve fees for all operations XCM Router performs. Find out the example output of this function in the [official documentation](https://paraspell.github.io/docs/router/router-use.html#get-router-fees).

```ts
const fees = await RouterBuilder(/*builder config - optional (More info in docs)*/)
      .from(TSubstrateChain) //Optional parameter based on scenario
      .to(TChain) //Optional parameter based on scenario
      .exchange(exchange) //Optional parameter based on scenario
      .currencyFrom(currencyFrom)
      .currencyTo(currencyTo)
      .amount(amount)
      .senderAddress(senderAddress)
      .recipientAddress(recipientAddress)
      .slippagePct(slippagePct)
      .getXcmFees();
```

## Dryrun router call

You can find out whether router dryrun call will execute correctly (works for 2 signature transfers also). You can find out more in [official documentation](https://paraspell.github.io/docs/router/router-use.html#dry-run-your-router-calls).

```ts
const fees = await RouterBuilder(/*builder config - optional (More info in docs)*/)
      .from(TSubstrateChain) //Optional parameter based on scenario
      .to(TChain) //Optional parameter based on scenario
      .exchange(exchange) //Optional parameter based on scenario
      .currencyFrom(currencyFrom)
      .currencyTo(currencyTo)
      .amount(amount)
      .senderAddress(senderAddress)
      .recipientAddress(recipientAddress)
      .slippagePct(slippagePct)
      .dryRun();
```

## Get minimal transferable amount

You can find out minimal amount you need to transfer in order to get the currency swapped (Does not guarantee it will be enough after swap). You can find out more in [official documentation](https://paraspell.github.io/docs/router/router-use.html#minimal-transferable-amount).

```ts
const fees = await RouterBuilder(/*builder config - optional (More info in docs)*/)
      .from(TSubstrateChain) //Optional parameter based on scenario
      .to(TChain) //Optional parameter based on scenario
      .exchange(exchange) //Optional parameter based on scenario
      .currencyFrom(currencyFrom)
      .currencyTo(currencyTo)
      .amount(amount)
      .senderAddress(senderAddress)
      .recipientAddress(recipientAddress)
      .slippagePct(slippagePct)
      .getMinTransferableAmount();
```

## Get maximal transferable amount

You can find out maximal amount of specific currency you can transfer while staying above existential deposit and leaving enough to cover execution fees on origin (If needed). You can find out more in [official documentation](https://paraspell.github.io/docs/router/router-use.html#maximal-transferable-amount).

```ts
const fees = await RouterBuilder(/*builder config - optional (More info in docs)*/)
      .from(TSubstrateChain) //Optional parameter based on scenario
      .to(TChain) //Optional parameter based on scenario
      .exchange(exchange) //Optional parameter based on scenario
      .currencyFrom(currencyFrom)
      .currencyTo(currencyTo)
      .amount(amount)
      .senderAddress(senderAddress)
      .recipientAddress(recipientAddress)
      .slippagePct(slippagePct)
      .getTransferableAmount();
```

## Helpful functions

Below, you can find helpful functions that are exported from XCM Router to help you enhance front end usability of XCM Router. You can find out more in [official documentation](https://paraspell.github.io/docs/router/router-use.html#helpful-functions).

```ts
import {getExchangeAssets, getExchangePairs} from @paraspell/xcm-router

//Returns all assets that DEX supports
const assets = getExchangeAssets('AssetHubPolkadotDex')

//Returns asset pairs supported by selected exchanges
const pairs = getExchangePairs(exchange) // exchange can be also array of exchanges such as [“HydrationDex”, “AcalaDex”] or undefined which will return all available pairs for all dexes
```

## 💻 Testing

- Run compilation using `pnpm compile`

- Run linting test using `pnpm lint`

- Run unit tests using `pnpm test`

> [!NOTE]
> XCM Router can be tested in [Playground](https://playground.paraspell.xyz/xcm-router).

## Contribute to XCM Tools and earn rewards 💰

We run an open Bug Bounty Program that rewards contributors for reporting and fixing bugs in the project. More information on bug bounty can be found in the [official documentation](https://paraspell.github.io/docs/contribution.html).

## Get Support 🚑

- Contact form on our [landing page](https://paraspell.xyz/#contact-us).
- Message us on our [X](https://x.com/paraspell).
- Support channel on [telegram](https://t.me/paraspell).

## License

Made with 💛 by [ParaSpell✨](https://paraspell.xyz/)

Published under [MIT License](https://github.com/paraspell/xcm-tools/blob/main/packages/xcm-router/LICENSE).

## Supported by

<p align="center">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://github.com/paraspell/presskit/blob/main/logos_supporters/polkadot_kusama_transparent.png">
      <source media="(prefers-color-scheme: light)" srcset="https://github.com/paraspell/presskit/blob/main/logos_supporters/polkadot_kusama_w3f_standard.png">
      <img width="750" alt="Shows a black logo in light color mode and a white one in dark color mode." src="https://github.com/paraspell/presskit/blob/main/logos_supporters/polkadot_kusama_w3f_standard.png">
    </picture>
</p>