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
      <img alt="build" src="https://github.com/paraspell/xcm-router/actions/workflows/ci.yml/badge.svg" />
    </a>
  </p>
  <p>XCM Router documentation <a href = "https://paraspell.github.io/docs/router/getting-strtd" \>[here]</p>
</div>

<br /><br />
<br /><br />

### Introduction
XCM Router (Codenamed SpellRouter) is ParaSpell's latest innovation, that allows for seamless XCM Exchanges. Send one token type and receive a different one you choose on the destination chain cross-chain. All within one call and three signatures. This seamless operation allows for a better user experience, limiting the possibility of user errors. The router currently implements the **9 largest Parachain DEXes** and is easy to extend as the number of DEXes with public SDKs increases. Together, there are **579** asset pools to choose from, making XCM Router the **largest liquidity bridging tool in the ecosystem**.

**Exchanges implemented:**
- Acala / 36 Pools available
- Basilisk / 15 Pools available
- BifrostKusama / 66 Pools available / Requires native token for swaps
- BifrostPolkadot / 45 Pools available / Requires native token for swaps
- HydraDX / 210 Pools available
- Interlay / 10 Pools available / Requires native token for swaps
- Karura / 136 Pools available
- Kintsugi / 6 Pools available / Requires native token for swaps
- Mangata / 55 Pools available / Requires native token for swaps

```NOTE: Some exchanges require native tokens in order to proceed with swaps.```

# Installation
#### Install dependencies
```bash
//PNPM temporarily unsupported
npm install || yarn add @polkadot/api @polkadot/types @polkadot/api-base @polkadot/apps-config @polkadot/util
```

#### Install XCM Router
```bash
//PNPM temporarily unsupported
npm install || yarn add @paraspell/xcm-router
```

## Importing package to your project

Builder pattern:
```ts
import { RouterBuilder } from '@paraspell/xcm-router'
```
Other patterns:
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

### Builder pattern with automatic exchange selection (Based on best price)

If you wish to have an exchange chain selection based on the best price outcome, you can opt for an automatic exchange selection method. This method can be selected by **not using** the `.exchange()` parameter in the call. The router will then automatically select the best exchange chain for you based on the best price outcome.

 ```js
await RouterBuilder
        .from('Polkadot')   //Origin Parachain/Relay chain
        .to('Astar')    //Destination Parachain/Relay chain
        .currencyFrom('DOT')    // Currency to send
        .currencyTo('ASTR')    // Currency to receive
        .amount('1000000')  // Amount to send
        .slippagePct('1')   // Max slipppage percentage
        .injectorAddress(injectorAddress)   //Injector address
        .recipientAddress(recipientAddress) //Recipient address
        .signer(injector.signer)    //Signer
        //.evmInjectorAddress(evmInjector address)   //Optional parameters when origin node is EVM based (Required with evmSigner)
        //.evmSigner(EVM signer)                     //Optional parameters when origin node is EVM based (Required with evmInjectorAddress)

        .onStatusChange((status: TTxProgressInfo) => {  //This is how we subscribe to calls that need signing
          console.log(status.hashes);   //Transaction hashes
          console.log(status.status);   //Transaction statuses
          console.log(status.type);    //Transaction types
        })
        .buildAndSend()
```

##  Builder pattern with manual exchange selection

If you wish to select your exchange chain manually, you can provide the additional `.exchange()` parameter to the call. The router will then use the exchange chain of your choice.

 ```js
await RouterBuilder
        .from('Polkadot')   //Origin Parachain/Relay chain
        .exchange('HydraDDex')    //Exchange Parachain
        .to('Astar')    //Destination Parachain/Relay chain
        .currencyFrom('DOT')    // Currency to send
        .currencyTo('ASTR')    // Currency to receive
        .amount('1000000')  // Amount to send
        .slippagePct('1')   // Max slipppage percentage
        .injectorAddress(selectedAccount.address)   //Injector address
        .recipientAddress(recipientAddress) //Recipient address
        .signer(injector.signer)    //Signer
        //.evmInjectorAddress(evmInjector address)   //Optional parameters when origin node is EVM based (Required with evmSigner)
        //.evmSigner(EVM signer)                     //Optional parameters when origin node is EVM based (Required with evmInjectorAddress)

        .onStatusChange((status: TTxProgressInfo) => {  //This is how we subscribe to calls that need signing
          console.log(status.hashes);   //Transaction hashes
          console.log(status.status);   //Transaction statuses
          console.log(status.type);    //Transaction types
        })
        .buildAndSend()
```

##  Function pattern with automatic exchange selection (Based on best price)

If you wish to have an exchange chain selection based on the best price outcome, you can opt for an automatic exchange selection method. This method can be selected by **not using**  `exchange:` parameter in the call. The router will then automatically select the best exchange chain for you based on the best price outcome.

```js
await transfer({
        from: 'Polkadot', //Origin Parachain/Relay chain
        to: 'Interlay', //Destination Parachain/Relay chain
        currencyFrom: 'DOT', // Currency to send
        currencyTo: 'INTR', // Currency to receive
        amount: '100000', // Amount to send
        slippagePct: '1', // Max slipppage percentage
        injectorAddress: selectedAccount.address, //Injector address
        address: recipientAddress, //Recipient address
        signer: injector.signer,  //Signer
        //evmInjectorAddress: evmInjector address,   //Optional parameters when origin node is EVM based (Required with evmSigner)
        //evmSigner: EVM signer,                     //Optional parameters when origin node is EVM based (Required with evmInjectorAddress)

        onStatusChange: (status: TTxProgressInfo) => {  //This is how we subscribe to calls that need signing
          console.log(status.hashes);   //Transaction hashes
          console.log(status.status);   //Transaction statuses
          console.log(status.type);     //Transaction types
        },
});

```

##  Function pattern with manual exchange selection

If you wish to select your exchange chain manually, you can provide the additional `exchange:` parameter to the call. The router will then use the exchange chain of your choice.

```js
await transfer({
        from: 'Polkadot', //Origin Parachain/Relay chain
        exchange: 'AcalaDex', //Exchange Parachain
        to: 'Interlay', //Destination Parachain/Relay chain
        currencyFrom: 'DOT', // Currency to send
        currencyTo: 'INTR', // Currency to receive
        amount: '100000', // Amount to send
        slippagePct: '1', // Max slipppage percentage
        injectorAddress: selectedAccount.address, //Injector address
        address: recipientAddress, //Recipient address
        signer: injector.signer,  //Signer
        //evmInjectorAddress: evmInjector address,   //Optional parameters when origin node is EVM based (Required with evmSigner)
        //evmSigner: EVM signer,                     //Optional parameters when origin node is EVM based (Required with evmInjectorAddress)

        onStatusChange: (status: TTxProgressInfo) => {  //This is how we subscribe to calls that need signing
          console.log(status.hashes);   //Transaction hashes
          console.log(status.status);   //Transaction statuses
          console.log(status.type);     //Transaction types
        },
});

```

## List of DEX chains, assets, and Parachains supported by XCM Router

| DEX | Can send to/receive from | Supported assets | Notes |
| ------------- | ------------- | ------------- |------------- |
| Acala DEX |Polkadot Relay, Astar, HydraDX, Interlay, Moonbeam, Parallel, AssetHubPolkadot, Unique network|ACA, DOT, aSEED, USDCet, UNQ, IBTC, INTR, lcDOT, LDOT| Fees are paid by either ACA or DOT|
|Karura DEX| Kusama Relay, Altair, Basilisk, BifrostKusama, Calamari, Crab, Parallel Heiko, Kintsugi, Moonriver, Quartz, Crust Shadow, Shiden, AssetHubKusama| BNC, USDCet, RMRK, ARIS, AIR, QTZ, CSM, USDT, KAR, KBTC, KINT, KSM, aSEED, LKSM, PHA, tKSM, TAI | Fees are paid by either KAR or KSM|
|HydraDX DEX| Polkadot Relay, Acala, Interlay, AssetHubPolkadot, Zeitgeist, Astar, Centrifuge, BifrostPolkadot| USDT, HDX, WETH, GLMR, IBTC, BNC, WBTC, vDOT, DAI, CFG, DOT, DAI, ZTG, WBTC, INTR, ASTR, LRNA, USDC| Chain automatically gives you native asset to pay for fees.|
| Basilisk DEX | Kusama Relay, Karura, AssetHubKusama, Tinkernet, Robonomics| BSX, USDT, aSEED, XRT, KSM, TNKR| Chain automatically gives you native asset to pay for fees.|
|Mangata DEX| Kusama Relay, AssetHubKusama, BifrostPolkadot, Moonriver, Turing, Imbue| MGX, IMBU, TUR, ZLK, BNC, USDT, RMRK, MOVR, vsKSM, KSM, vKSM| Chain requires native MGX asset to pay for fees.|
|Bifrost Kusama DEX| Kusama Relay, AssetHubKusama, Karura, Moonriver, Kintsugi, Mangata| BNC, vBNC, vsKSM, vKSM, USDT, aSEED, KAR, ZLK, RMRK, KBTC, MOVR, vMOVR| Chain requires native BNC asset for fees.|
|Bifrost Polkadot DEX| Polkadot Relay, AssetHubPolkadot, Moonbeam, Astar, Interlay| BNC, vDOT, vsDOT, USDT, FIL, vFIL, ASTR, vASTR, GLMR, vGLMR, MANTA, vMANTA|Chain requires native BNC asset for fees.|
|Interlay DEX| Polkadot Relay, Acala, Astar, Parallel, PolkadotAssetHub, HydraDX, BifrostPolkadot |INTR, DOT, IBTC, USDT, VDOT| Chain requires native INTR asset for fees.|
|Kintsugi DEX| Kusama Relay, Karura, KusamaAssetHub, Parallel Heiko, BifrostKusama|KINT,KSM,KBTC,USDT|Chain requires native KINT asset for fees.|

## 💻 Testing

- Run compilation using `yarn compile`

- Run linting test using `yarn lint`

- Run unit tests using `yarn test`

- Run integration tests using `yarn test:integration`

XCM Router can be tested in [Playground](https://github.com/paraspell/xcm-tools/tree/main/apps/playground).

## License

Made with 💛 by [ParaSpell✨](https://github.com/paraspell)

Published under [MIT License](https://github.com/paraspell/xcm-tools/blob/main/packages/xcm-router/LICENSE).

## Support

<div align="center">
 <p align="center">
    <a href="https://github.com/w3f/Grants-Program/pull/2057">
      <img width="200" alt="version" src="https://user-images.githubusercontent.com/55763425/211145923-f7ee2a57-3e63-4b7d-9674-2da9db46b2ee.png" />
    </a>
 </p>
</div>
