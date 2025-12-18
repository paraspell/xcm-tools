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

### Introduction
XCM Router (Codenamed SpellRouter) is ParaSpell's latest innovation that allows for seamless XCM Exchanges. Send one token type and receive a different one you choose on the destination chain cross-chain. All within **one call with one signature or two signatures (In cases where one signature calls are not supported)**. This seamless operation allows for a better user experience, limiting the possibility of user errors. The router currently implements the **8 largest Parachain DEXes** and is easy to extend as the number of DEXes with public SDKs increases. Together, there are **556** asset pools to choose from, making XCM Router the **largest liquidity bridging tool in the ecosystem**.

**Exchanges implemented:**
```
1️⃣ Supporting one click swaps
- Hydration / 210 Pools available
- AssetHubPolkadot / 32 Pools available

2️⃣ Supporting standard two click swaps
- Acala / 36 Pools available
- Basilisk / 15 Pools available
- BifrostKusama / 66 Pools available / Requires native token for swaps
- BifrostPolkadot / 45 Pools available / Requires native token for swaps
- Karura / 136 Pools available
- AssetHubKusama / 16 Pools available / Requires specific native tokens for swaps
```

**⚠️ IMPORTANT NOTES:** 
```
- 📣 Some exchanges require native tokens to proceed with swaps.

- 📣 Router now supports one-click cross-chain swaps! Supported exchanges are AssetHubPolkadot and Hydration.
        -Sidenote: Not all chains can be selected as origin for one-click cross-chain swaps, because their barrier doesn't support executing instructions. All chains can be selected as a destination, however. For origin chains that do not support execute instruction, we automatically default to the original two-click scenario.
```

# Installation
#### Install dependencies

```
⚠️ NOTE
Enabling Wasm is required by Hydration SDK in order for XCM-Router to work in your dAPP. You can either enable it in web app config or by plugin.
Hydration also requires augment package - https://github.com/galacticcouncil/sdk/issues/114

⚠️⚠️ NOTE
XCM Router is now migrated towards PAPI library! To migrate you just need to replace old PJS injector with PAPI signer and install new peer dependency. Explore docs to find out more.
```

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
        .from(TChain)   //Origin Parachain/Relay chain - OPTIONAL PARAMETER
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
        .from(TChain)   //Origin Parachain/Relay chain - OPTIONAL PARAMETER
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
        .from(TChain)   //Origin Parachain/Relay chain - OPTIONAL PARAMETER
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
      .from(TChain) //Optional parameter based on scenario
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
      .from(TChain) //Optional parameter based on scenario
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
      .from(TChain) //Optional parameter based on scenario
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
      .from(TChain) //Optional parameter based on scenario
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
      .from(TChain) //Optional parameter based on scenario
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

## List of DEX chains, assets, and Parachains supported by XCM Router

| DEX | Can send to/receive from | Supported assets | Notes |
| ------------- | ------------- | ------------- |------------- |
| Acala DEX |Polkadot Relay, Astar, HydraDX, Interlay, Moonbeam, Parallel, AssetHubPolkadot, Unique network|ACA, DOT, aSEED, USDCet, UNQ, IBTC, INTR, lcDOT, LDOT| Fees are paid by either ACA or DOT|
|Karura DEX| Kusama Relay, Altair, Basilisk, BifrostKusama, Calamari, Crab, Parallel Heiko, Kintsugi, Moonriver, Quartz, Crust Shadow, Shiden, AssetHubKusama| BNC, USDCet, RMRK, ARIS, AIR, QTZ, CSM, USDT, KAR, KBTC, KINT, KSM, aSEED, LKSM, PHA, tKSM, TAI | Fees are paid by either KAR or KSM|
|Hydration DEX| Polkadot Relay, Acala, Interlay, AssetHubPolkadot, Zeitgeist, Astar, Centrifuge, BifrostPolkadot, Mythos | USDT, MYTH, HDX, WETH, GLMR, IBTC, BNC, WBTC, vDOT, DAI, CFG, DOT, DAI, ZTG, WBTC, INTR, ASTR, LRNA, USDC| Chain automatically gives you native asset to pay for fees.|
| Basilisk DEX | Kusama Relay, Karura, AssetHubKusama, Tinkernet, Robonomics| BSX, USDT, aSEED, XRT, KSM, TNKR| Chain automatically gives you native asset to pay for fees.|
|Bifrost Kusama DEX| Kusama Relay, AssetHubKusama, Karura, Moonriver, Kintsugi| BNC, vBNC, vsKSM, vKSM, USDT, aSEED, KAR, ZLK, RMRK, KBTC, MOVR, vMOVR| Chain requires native BNC asset for fees.|
|Bifrost Polkadot DEX| Polkadot Relay, AssetHubPolkadot, Moonbeam, Astar, Interlay| BNC, vDOT, vsDOT, USDT, FIL, vFIL, ASTR, vASTR, GLMR, vGLMR, MANTA, vMANTA|Chain requires native BNC asset for fees.|
|AssetHubPolkadot| Polkadot Relay, Any Parachain it has HRMP channel with | DOT, WETH.e, USDC, USDT, LAOS, MYTH, WBBTC.e, ASX, BILL, DEMO, TATE, PINK, MODE, MVPW, PIGS, DED, wstETH.e, TTT, KSM, tBTC.e, PEPE.e, SHIB.e, TON.e, NAT, NT2, DOTA, STINK, MTC, AJUN, GGI, GLMR, NIN | Requires specific native tokens for swaps |
|AssetHubKusama| Kusama Relay, Any Parachain it has HRMP channel with | KSM, DOT, USDC, USDT, BILLCOIN, WOOD, dUSD, TACP, TSM, MA42, USDT, DMO, JAM | Requires specific native tokens for swaps |

## 💻 Testing

- Run compilation using `pnpm compile`

- Run linting test using `pnpm lint`

- Run unit tests using `pnpm test`

XCM Router can be tested in [Playground](https://playground.paraspell.xyz/xcm-router).

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

<div>
  <div align="center" style="margin-top: 20px;">
      <img width="750" alt="version" src="https://github.com/user-attachments/assets/29e4b099-d90c-46d6-a3ce-94edfbda003c" />
  </div>
</div>
