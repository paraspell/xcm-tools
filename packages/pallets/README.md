<br /><br />

<div align="center">
  <h1 align="center">@paraspell/pallets</h1>
  <h4 align="center"> Pallet queries for Polkadot and Kusama Parachains. </h4>
  <p align="center">
    <a href="https://npmjs.com/package/@paraspell/pallets">
      <img alt="version" src="https://img.shields.io/npm/v/@paraspell/pallets?style=flat-square" />
    </a>
    <a href="https://npmjs.com/package/@paraspell/pallets">
      <img alt="downloads" src="https://img.shields.io/npm/dm/@paraspell/pallets?style=flat-square" />
    </a>
    <a href="https://github.com/paraspell/xcm-sdk/actions">
      <img alt="build" src="https://github.com/paraspell/xcm-sdk/actions/workflows/release.yml/badge.svg" />
    </a>
    <a href="https://snyk.io/test/github/paraspell/sdk">
      <img alt="snyk" src="https://snyk.io/test/github/paraspell/sdk/badge.svg" />
    </a>
  </p>
</div>

<br /><br />
<br /><br />

## Information

This package serves as a `core` component for both `@paraspell/sdk` and `@paraspell/sdk-pjs` and is `automatically` installed as a `dependency`. The package on its own offers functionality that can be imported separately and be used in front-end applications. It allows developers to query the `XCM pallets` that Parachains currently support. 

## Implementation

### Install package

```bash
pnpm | npm install || yarn add @paraspell/pallets
```

### Import functionality

To use this functionality you first have to import it in the following way.
```ts
import { getDefaultPallet, getSupportedPallets, getPalletIndex, SUPPORTED_PALLETS } from  '@paraspell/pallets'
```

### Get default XCM pallet

The function returns the default XCM pallet for selected compatible Parachain.
```ts
getDefaultPallet(chain: TChain)
```

### Get all supported XCM pallets

The function returns all supported XCM pallets for selected compatible Parachain.
```ts
getSupportedPallets(chain: TChain)
```

### Get index of XCM Pallet

The function returns all index of XCM Pallet for selected Parachain.
```ts
getPalletIndex(chain: TChain)
```

### Print all supported XCM pallets

This returns all supported XCM pallets supported by compatible Parachains as constant.
```ts
console.log(SUPPORTED_PALLETS)
```

## 💻 Tests

- Run compilation using `pnpm compile`

- Run linter using `pnpm lint`

- Run unit tests using `pnpm test`

- Update XCM pallets in the map using script - `pnpm updatePallets`

Pallet queries can be tested in [Playground](https://github.com/paraspell/xcm-tools/tree/main/apps/playground).

## Contribute to XCM Tools and earn rewards 💰

We run an open Bug Bounty Program that rewards contributors for reporting and fixing bugs in the project. More information on bug bounty can be found in the [official documentation](https://paraspell.github.io/docs/contribution.html).

## Get Support 🚑

- Contact form on our [landing page](https://paraspell.xyz/#contact-us).
- Message us on our [X](https://x.com/paraspell).
- Support channel on [telegram](https://t.me/paraspell).

## License

Made with 💛 by [ParaSpell✨](https://paraspell.xyz/)

Published under [MIT License](https://playground.paraspell.xyz/xcm-sdk/pallets).

## Supported by

<div align="center">
 <p align="center">
      <img width="200" alt="version" src="https://user-images.githubusercontent.com/55763425/211145923-f7ee2a57-3e63-4b7d-9674-2da9db46b2ee.png" />
      <img width="200" alt="version" src="https://github.com/paraspell/xcm-sdk/assets/55763425/9ed74ebe-9b29-4efd-8e3e-7467ac4caed6" />
 </p>
</div>
