# @paraspell/sdk

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![Github Actions][github-actions-src]][github-actions-href]
[![Codecov][codecov-src]][codecov-href]

> Package description

## Usage

Install package:

```sh
# npm
npm install @paraspell/sdk

# yarn
yarn install @paraspell/sdk

# pnpm
pnpm install @paraspell/sdk
```

Import:

```js
// ESM
import * as paraspell from '@paraspell/sdk'

// CommonJS
const { } = require('@paraspell/sdk')
```

## Currently implemented pallets
```ts
//xToken pallet:
paraspell.xTokens.transferParaToPara(api: ApiPromise, origin: origin Parachain name string, destination: destination Parachain ID, currency: currency symbol string, amount: any, to: destination address string)
paraspell.xTokens.transferParaToRelay(api: ApiPromise, origin: origin Parachain name string, currency: currency symbol string, amount: any, to: destination address string)
paraspell.xTokens.transferRelayToPara(api: ApiPromise, destination: destination Parachain ID, amount: any, to: destination address string)
//hrmp pallet:
paraspell.closeChannels.closeChannel(api: ApiPromise, origin: origin Parachain ID, inbound: number, outbound: number)
//parasSudoWrapper pallet:
paraspell.openChannels.openChannel(api: ApiPromise, origin: origin Parachain ID, destination: destination Parachain ID, maxSize: number, maxMessageSize: number)

```
Example of usage can be found in the UI repository [here](https://github.com/paraspell/ui)

## 💻 Development

- Clone this repository
- Enable [Corepack](https://github.com/nodejs/corepack) using `corepack enable` (use `npm i -g corepack` for Node.js < 16.10)
- Install dependencies using `pnpm install`
- Run interactive tests using `pnpm dev`

## License
Made with 💛

Published under [MIT License](./LICENSE).

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/@paraspell/sdk?style=flat-square
[npm-version-href]: https://npmjs.com/package/@paraspell/sdk

[npm-downloads-src]: https://img.shields.io/npm/dm/@paraspell/sdk?style=flat-square
[npm-downloads-href]: https://npmjs.com/package/@paraspell/sdk

[github-actions-src]: https://img.shields.io/github/workflow/status/unjs/@paraspell/sdk/ci/main?style=flat-square
[github-actions-href]: https://github.com/unjs/@paraspell/sdk/actions?query=workflow%3Aci

[codecov-src]: https://img.shields.io/codecov/c/gh/unjs/@paraspell/sdk/main?style=flat-square
[codecov-href]: https://codecov.io/gh/unjs/@paraspell/sdk
