
# @paraspell/sdk

  

[![npm version][npm-version-src]][npm-version-href]

[![npm downloads][npm-downloads-src]][npm-downloads-href]



[![Known Vulnerabilities](https://snyk.io/test/github/paraspell/sdk/badge.svg)](https://snyk.io/test/github/paraspell/sdk)
  

SDK For XCM & XCMP handling made with ❤️ by ParaSpell✨. It is no longer necessary to construct calls manually. @paraspell/sdk handles this for you. Feel free to become magician and try your paraSPELLS 🧙✨. 

#####  Currently supporting 29 Polkadot & Kusama nodes list [here](https://github.com/paraspell/sdk/docs/supportedNodes.md). 

  

## Usage

  

Install package:

  

##### Install via npm
```
npm install @paraspell/sdk
```
##### Install via yarn
```
yarn install @paraspell/sdk
```
 ##### Install via pnpm
```
pnpm install @paraspell/sdk
```

  

 ##### Importing package to your project:

 
```js

// ESM
import  *  as  paraspell  from  '@paraspell/sdk'

// CommonJS
const paraspell = require('@paraspell/sdk')

```

  

## Currently implemented pallets

```ts

//xToken pallet:

//Transfer tokens from Parachain to Parachain
paraspell.xTokens.transferParaToPara(api: ApiPromise, origin: origin  Parachain  name  string, destination: destination  Parachain  ID, currency: currency  symbol  string, currencyID: number, amount: any, to: destination  address  string)

//Transfer tokens from Parachain to Relay chain
paraspell.xTokens.transferParaToRelay(api: ApiPromise, origin: origin  Parachain  name  string, currency: currency  symbol  string, currencyID: number, amount: any, to: destination  address  string)

//Transfer tokens from Relay chain to Parachain
paraspell.xTokens.transferRelayToPara(api: ApiPromise, destination: destination  Parachain  ID, amount: any, to: destination  address  string)

//Transfer tokens from Relay chain to Parachain /w specific limit
xTokens.xTokens.limitedTransferRelayToPara(api,destParaID,amount,destinationAddress,yourWeight,true)

//hrmp pallet:

//Close HRMP channels
paraspell.closeChannels.closeChannel(api: ApiPromise, origin: origin  Parachain  ID, inbound: number, outbound: number)


//parasSudoWrapper pallet:

//Open HRMP channels
paraspell.openChannels.openChannel(api: ApiPromise, origin: origin  Parachain  ID, destination: destination  Parachain  ID, maxSize: number, maxMessageSize: number)

  

```

 ##### Example of usage can be found in the UI repository [here](https://github.com/paraspell/ui)
 ##### List of currently compatible nodes can be found [here](https://github.com/paraspell/sdk/docs/supportedNodes.md)

  

## 💻 Development

  

- Clone this repository

- Enable [Corepack](https://github.com/nodejs/corepack) using `corepack enable` (use `npm i -g corepack` for Node.js < 16.10)

- Install dependencies using `pnpm install`

- Run interactive tests using `pnpm dev`

  

## License

Made with 💛 by [ParaSpell✨](https://github.com/paraspell)

  

Published under [MIT License](https://github.com/paraspell/sdk/blob/main/LICENSE).

  

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/@paraspell/sdk?style=flat-square

[npm-version-href]: https://npmjs.com/package/@paraspell/sdk

  

[npm-downloads-src]: https://img.shields.io/npm/dm/@paraspell/sdk?style=flat-square

[npm-downloads-href]: https://npmjs.com/package/@paraspell/sdk

  

[github-actions-src]: https://img.shields.io/github/workflow/status/unjs/@paraspell/sdk/ci/main?style=flat-square

[github-actions-href]: https://github.com/unjs/@paraspell/sdk/actions?query=workflow%3Aci

  

[codecov-src]: https://img.shields.io/codecov/c/gh/unjs/@paraspell/sdk/main?style=flat-square

[codecov-href]: https://codecov.io/gh/unjs/@paraspell/sdk