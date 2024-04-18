<br /><br />

<div align="center">
  <h1 align="center">@paraspell/xcm-analyser</h1>
  <h4 align="center"> Tool to convert XCM multiLocations into human-readable format. </h4>
  <p align="center">
    <a href="https://npmjs.com/package/@paraspell/sdk">
      <img alt="version" src="https://img.shields.io/npm/v/@paraspell/xcm-analyser?style=flat-square" />
    </a>
    <a href="https://npmjs.com/package/@paraspell/sdk">
      <img alt="downloads" src="https://img.shields.io/npm/dm/@paraspell/xcm-analyser?style=flat-square" />
    </a>
    <a href="https://github.com/paraspell/xcm-sdk/actions">
      <img alt="build" src="https://github.com/paraspell/xcm-sdk/actions/workflows/release.yml/badge.svg" />
    </a>
    <a href="https://snyk.io/test/github/paraspell/sdk">
      <img alt="snyk" src="https://snyk.io/test/github/paraspell/sdk/badge.svg" />
    </a>
  </p>
  <p>Analyser documentation <a href = "https://paraspell.github.io/docs/" \>[here]</p>
</div>

<br /><br />
<br /><br />
## Installation

#### Install SDK 

```bash
pnpm | npm install || yarn add @paraspell/xcm-analyser 
```
## Implementation
```
NOTE:
The following junction types are supported:

Parachain
AccountId32
AccountIndex64
AccountKey20
PalletInstance
GeneralIndex
GeneralKey
OnlyChild
Plurality
GlobalConsensus
```
#### Compile a single multilocation object to the URL

To compile a single multilocation object to url use the following structure:

```js
//Importing the call
import { convertMultilocationToUrl } from '@paraspell/xcm-analyser';

//Define the multilocation you wish to convert to URL
/*const multilocation: MultiLocation = {
      parents: '0',
      interior: {
        X2: [
          {
            PalletInstance: '50',
          },
          {
            GeneralIndex: '41',
          },
        ],
      },
    };*/

const result = convertMultilocationToUrl(multiplication);

/*
This should result into:
'./PalletInstance(50)/GeneralIndex(41)'
*/
```

#### Compile a single multilocation JSON to the URL
To compile a single multilocation JSON to url use the following structure:

```js
//Importing the call
import { convertMultilocationToUrlJson } from '@paraspell/xcm-analyser';

const result = convertMultilocationToUrl({
      parents: '3',
      interior: {
        X2: [
          {
            PalletInstance: '50',
          },
          {
            GeneralIndex: '41',
          },
        ],
      },
});

/*
This should result into:
''../../../PalletInstance(50)/GeneralIndex(41)''
*/
```

#### Compile the entire XCM call to the URL
To compile the entire XCM call to the URL use the following structure:

```js
//Importing the call
import { convertXCMToUrls } from '@paraspell/xcm-analyser';

//Define XCM call arguments you wish to convert
/*const xcmCallArguments = [
  {
    V3: {
      parents: '1',
      interior: {
        X1: {
          Parachain: '2006',
        },
      },
    },
  },
  {
    V3: {
      parents: '0',
      interior: {
        X1: {
          AccountId32: {
            network: null,
            id: 'accountID',
          },
        },
      },
    },
  },
  {
    V3: [
      {
        id: {
          Concrete: {
            parents: '0',
            interior: {
              X2: [{ PalletInstance: '50' }, { GeneralIndex: '1984' }],
            },
          },
        },
        fun: {
          Fungible: 'amount',
        },
      },
    ],
  },
];*/

const urls = convertXCMToUrls(xcmCallArguments);

/*
This should result into:
[
  '../Parachain(2006)',
  './AccountId32(null, accountID)',
  './PalletInstance(50)/GeneralIndex(1984)',
]
*/
```

## 💻 Tests
- Run compilation using `pnpm compile`

- Run linter using `pnpm lint`

- Run unit tests using `pnpm test`

- Run all core tests and checks using `pnpm runAll`

- Run an example from [example file](https://github.com/paraspell/xcm-tools/blob/main/packages/xcm-analyser/scripts/example.ts) using `pnpm runExample`

## License

Made with 💛 by [ParaSpell✨](https://github.com/paraspell)

Published under [MIT License](https://github.com/paraspell/xcm-tools/blob/main/packages/xcm-analyser/LICENSE).

