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
XCM Router (Codenamed SpellRouter) is ParaSpell's latest innovation that allows for seamless XCM Exchanges. Send one token type and receive a different one you choose on the destination chain cross-chain. All within **one call and only two signatures**. This seamless operation allows for a better user experience, limiting the possibility of user errors. The router currently implements the **8 largest Parachain DEXes** and is easy to extend as the number of DEXes with public SDKs increases. Together, there are **556** asset pools to choose from, making XCM Router the **largest liquidity bridging tool in the ecosystem**.

**Exchanges implemented:**
- Acala / 36 Pools available
- Basilisk / 15 Pools available
- BifrostKusama / 66 Pools available / Requires native token for swaps
- BifrostPolkadot / 45 Pools available / Requires native token for swaps
- HydraDX / 210 Pools available
- Karura / 136 Pools available
- AssetHubPolkadot / 32 Pools available / Requires specific native tokens for swaps
- AssetHubKusama / 16 Pools available / Requires specific native tokens for swaps

```NOTE: Some exchanges require native tokens in order to proceed with swaps.```

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

If you wish to have an exchange chain selection based on the best price outcome, you can opt for an automatic exchange selection method. This method can be selected by **not using** the `.exchange()` parameter in the call. The router will then automatically select the best exchange chain for you based on the best price outcome.

 ```js
await RouterBuilder
        .from('Polkadot')   //Origin Parachain/Relay chain - OPTIONAL PARAMETER
        .to('Astar')    //Destination Parachain/Relay chain - OPTIONAL PARAMETER
        .currencyFrom({symbol: 'DOT'})    // Currency to send {id: currencyID, amount: amount} | {symbol: currencySymbol, amount: amount} | {symbol: Native('currencySymbol'), amount: amount} | {symbol: Foreign('currencySymbol'), amount: amount} | {symbol: ForeignAbstract('currencySymbol'), amount: amount} | {multilocation: AssetMultilocationString, amount: amount | AssetMultilocationJson, amount: amount}
        .currencyTo({symbol: 'ASTR'})    // Currency to receive {id: currencyID, amount: amount} | {symbol: currencySymbol, amount: amount} | {symbol: Native('currencySymbol'), amount: amount} | {symbol: Foreign('currencySymbol'), amount: amount} | {symbol: ForeignAbstract('currencySymbol'), amount: amount} | {multilocation: AssetMultilocationString, amount: amount | AssetMultilocationJson, amount: amount}
        .amount('1000000')  // Amount to send
        .slippagePct('1')   // Max slipppage percentage
        .senderAddress(injectorAddress)   //Injector address
        .recipientAddress(recipientAddress) //Recipient address
        .signer(signer)    //PAPI Signer
        //.evmSenderAddress(evmInjector address)   //Optional parameters when origin node is EVM based (Required with evmSigner)
        //.evmSigner(EVM signer)                     //Optional parameters when origin node is EVM based (Required with evmInjectorAddress)

        .onStatusChange((status: TRouterEvent) => {  //This is how we subscribe to calls that need signing
          console.log(status.type);   // Current transaction type
          console.log(status.routerPlan);   // Array of all transactions to execute
          console.log(status.node);   // Current transaction origin node
          console.log(status.destinationNode);    // Current transaction destination node
          console.log(status.currentStep);    // 0-based step index of current transaction
        })
        .buildAndSend()
```

## Whitelist exchange selection

If you wish to have specific exchanges selection and select the best one among them based on the best price outcome, you can opt for the whitelist automatic exchange selection method. This method can be selected by **using** `.exchange()` parameter in the call and feeding it with **array of exchanges**. The router will then automatically select the best exchange chain for you based on the best price outcome.

```ts
await RouterBuilder
        .from('Polkadot')   //Origin Parachain/Relay chain - OPTIONAL PARAMETER
        .exchange(['HydrationDex','AcalaDex','AssetHubPolkadotDex'])    //Exchange Parachains
        .to('Astar')    //Destination Parachain/Relay chain - OPTIONAL PARAMETER
        .currencyFrom({symbol: 'DOT'})    // Currency to send - {id: currencyID, amount: amount} | {symbol: currencySymbol, amount: amount} | {symbol: Native('currencySymbol'), amount: amount} | {symbol: Foreign('currencySymbol'), amount: amount} | {symbol: ForeignAbstract('currencySymbol'), amount: amount} | {multilocation: AssetMultilocationString, amount: amount | AssetMultilocationJson, amount: amount} 
        .currencyTo({symbol: 'ASTR'})    // Currency to receive - {id: currencyID, amount: amount} | {symbol: currencySymbol, amount: amount} | {symbol: Native('currencySymbol'), amount: amount} | {symbol: Foreign('currencySymbol'), amount: amount} | {symbol: ForeignAbstract('currencySymbol'), amount: amount} | {multilocation: AssetMultilocationString, amount: amount | AssetMultilocationJson, amount: amount}
        .amount('1000000')  // Amount to send
        .slippagePct('1')   // Max slipppage percentage
        .senderAddress(selectedAccount.address)   //Injector address
        .recipientAddress(recipientAddress) //Recipient address
        .signer(signer)    //PAPI Signer
        //.evmSenderAddress(evmInjector address)   //Optional parameters when origin node is EVM based (Required with evmSigner)
        //.evmSigner(EVM signer)                     //Optional parameters when origin node is EVM based (Required with evmInjectorAddress)

        .onStatusChange((status: TRouterEvent) => {  //This is how we subscribe to calls that need signing
          console.log(status.type);   // Current transaction type
          console.log(status.routerPlan);   // Array of all transactions to execute
          console.log(status.node);   // Current transaction origin node
          console.log(status.destinationNode);    // Current transaction destination node
          console.log(status.currentStep);    // 0-based step index of current transaction
        })
        .buildAndSend()
```

## Manual exchange selection

If you wish to select your exchange chain manually, you can provide the additional `.exchange()` parameter to the call. The router will then use the exchange chain of your choice.

 ```js
await RouterBuilder
        .from('Polkadot')   //Origin Parachain/Relay chain - OPTIONAL PARAMETER
        .exchange('HydraDDex')    //Exchange Parachain
        .to('Astar')    //Destination Parachain/Relay chain - OPTIONAL PARAMETER
        .currencyFrom({symbol: 'DOT'})    // Currency to send {id: currencyID, amount: amount} | {symbol: currencySymbol, amount: amount} | {symbol: Native('currencySymbol'), amount: amount} | {symbol: Foreign('currencySymbol'), amount: amount} | {symbol: ForeignAbstract('currencySymbol'), amount: amount} | {multilocation: AssetMultilocationString, amount: amount | AssetMultilocationJson, amount: amount}
        .currencyTo({symbol: 'ASTR'})    // Currency to receive {id: currencyID, amount: amount} | {symbol: currencySymbol, amount: amount} | {symbol: Native('currencySymbol'), amount: amount} | {symbol: Foreign('currencySymbol'), amount: amount} | {symbol: ForeignAbstract('currencySymbol'), amount: amount} | {multilocation: AssetMultilocationString, amount: amount | AssetMultilocationJson, amount: amount}
        .amount('1000000')  // Amount to send
        .slippagePct('1')   // Max slipppage percentage
        .senderAddress(selectedAccount.address)   //Injector address
        .recipientAddress(recipientAddress) //Recipient address
        .signer(signer)    //PAPI Signer
        //.evmSignerAddress(evmInjector address)   //Optional parameters when origin node is EVM based (Required with evmSigner)
        //.evmSigner(EVM signer)                     //Optional parameters when origin node is EVM based (Required with evmInjectorAddress)

        .onStatusChange((status: TRouterEvent) => {  //This is how we subscribe to calls that need signing
          console.log(status.type);   // Current transaction type
          console.log(status.routerPlan);   // Array of all transactions to execute
          console.log(status.node);   // Current transaction origin node
          console.log(status.destinationNode);    // Current transaction destination node
          console.log(status.currentStep);    // 0-based step index of current transaction
        })
        .buildAndSend()
```

## Get amount out for your currency pair

To retrieve exchange amount, that you receive for your desired asset pair you can use following function. This function returns 2 parameters. Name of best fitting DEX (Automatic selection - can be further used for manual selection) and Amount out

```ts
const result = await RouterBuilder()
      .from('Astar') //Optional parameter
      .to('Acala') //Optional parameter
      .exchange('Hydration') //Optional parameter
      .currencyFrom({ symbol: 'ASTR' }) 
      .currencyTo({ symbol: 'DOT' })
      .amount(10000000000n)
      .getBestAmountOut();

console.log(result.amountOut)
console.log(result.exchange)
```

## Helpful functions

Below, you can find helpful functions that are exported from XCM Router to help you enhance front end usability of XCM Router.

```ts
import {getExchangeAssets, getExchangePairs} from @paraspell/xcm-router

//Returns all assets that DEX supports
const assets = getExchangeAssets('AssetHubPolkadotDex')

//Returns asset pairs supported by selected exchanges
getExchangePairs(exchange) // exchange can be also array of exchanges such as [“HydrationDex”, “AcalaDex”] or undefined which will return all available pairs for all dexes
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

- Run compilation using `yarn compile`

- Run linting test using `yarn lint`

- Run unit tests using `yarn test`

- Run integration tests using `yarn test:integration`

XCM Router can be tested in [Playground](https://playground.paraspell.xyz/xcm-router).

## License

Made with 💛 by [ParaSpell✨](https://paraspell.xyz/)

Published under [MIT License](https://github.com/paraspell/xcm-tools/blob/main/packages/xcm-router/LICENSE).

## Support

<div align="center">
 <p align="center">
    <a href="https://github.com/w3f/Grants-Program/pull/2057">
      <img width="200" alt="version" src="https://user-images.githubusercontent.com/55763425/211145923-f7ee2a57-3e63-4b7d-9674-2da9db46b2ee.png" />
    </a>
 </p>
</div>