# Changelog

## [2.0.1](https://github.com/paraspell/xcm-tools/compare/xcm-router-v2.0.0...xcm-router-v2.0.1) (2025-01-16)


### Bug Fixes

* Add no-console rule to ESlint configuration ✨ ([d58a744](https://github.com/paraspell/xcm-tools/commit/d58a744c8fb4a892697eed9fca0f5514c7dfb243))
* Enable support for bigint literals ✨ ([0090106](https://github.com/paraspell/xcm-tools/commit/0090106babe2dcecf66d4eaa532d3963a230958b))
* Fix package json warnings 🔧 ([de6ea5d](https://github.com/paraspell/xcm-tools/commit/de6ea5df89513753b7a83e4053121a4b207a97c5))
* Update Rollup TypeScript plugin to official version ⬆ ([20c0f25](https://github.com/paraspell/xcm-tools/commit/20c0f25224a86b859ac1ad043c5cf04febdf743e))


### Code Refactoring

* **xcm-router:** Refactor transfer functions 🔧 ([420db1e](https://github.com/paraspell/xcm-tools/commit/420db1ec3361add1a24764ac0d6a6d6353d31032))


### Tests

* **xcm-router:** Speed up XCM Router tests 🧪 ([e1e2373](https://github.com/paraspell/xcm-tools/commit/e1e2373f6c4b7a515d6af8d805d66bef28b19110))

## [2.0.0](https://github.com/paraspell/xcm-tools/compare/xcm-router-v1.5.0...xcm-router-v2.0.0) (2024-12-29)


### ⚠ BREAKING CHANGES

* Split SDK into separate packages for PJS and PAPI ✨
* **sdk:** Refactor transfer Builder to explicitly include from, to parameters for relaychains

### Features

* **playground:** Add support for multi-assets to playground 🛝 ([132f475](https://github.com/paraspell/xcm-tools/commit/132f4753e49f89f479cd29043b67917ad9993755))
* **sdk:** Add fail-safe support ✨ ([18b1328](https://github.com/paraspell/xcm-tools/commit/18b1328ba3f079d03adebc67ba2d15634d115055))
* **sdk:** Add support for Moonbeam EVM transfers ✨ ([d30ba8e](https://github.com/paraspell/xcm-tools/commit/d30ba8e941c9f0835b35d9887339e88e9f1986e8))
* **sdk:** Refactor transfer Builder to explicitly include from, to parameters for relaychains ([395b45e](https://github.com/paraspell/xcm-tools/commit/395b45e2d1bfe68c84cea7d19b44e16f2a3b4cd8))
* Split SDK into separate packages for PJS and PAPI ✨ ([ff465e9](https://github.com/paraspell/xcm-tools/commit/ff465e92e57640f525c7d350afec0b9dcf364453))


### Miscellaneous Chores

* Perform monthly maintenance check  👨‍🔧 ([a85c3bd](https://github.com/paraspell/xcm-tools/commit/a85c3bd427b6d1d829155bf32a4524637eb78a1f))
* **xcm-router:** Default to builder pattern ([82b6305](https://github.com/paraspell/xcm-tools/commit/82b6305c0bceeab9ea84e4a6797aa4b6ba06d2bc))
* **xcm-router:** Update README.md ([c38cb49](https://github.com/paraspell/xcm-tools/commit/c38cb49c50c39b02ab84a2a4c5e9cb5e4fd45fa0))


### Continuous Integration

* Update Node.js to v22 LTS 📦 ([f7d4902](https://github.com/paraspell/xcm-tools/commit/f7d49029e295fb4bd3840ab27abe40d3168beae5))

## [1.5.0](https://github.com/paraspell/xcm-tools/compare/xcm-router-v1.4.1...xcm-router-v1.5.0) (2024-11-30)


### Features

* **sdk:** Add asset search by multi-location ✨ ([54d0d46](https://github.com/paraspell/xcm-tools/commit/54d0d46d96e4b17b315856a61563a13209fef026))
* **sdk:** Add support for abstracted assets selection ✨ ([b5ffed8](https://github.com/paraspell/xcm-tools/commit/b5ffed8958aa5680a5ffc9308f0f7f0dd1c1d727))


### Bug Fixes

* Add destination address checks ([f072da7](https://github.com/paraspell/xcm-tools/commit/f072da7c032ed9fb871191f4975115e779608ed0))
* **sdk:** Remove @polkadot/apps-config depencency ([8a5bbc7](https://github.com/paraspell/xcm-tools/commit/8a5bbc7e5f31ec928e4be2714a69f666fd706fd1))
* **xcm-api:** Remove old XCM API code 👴 ([973dfde](https://github.com/paraspell/xcm-tools/commit/973dfde2cc6206ebdee90b45bda1cd871c0063b3))


### Miscellaneous Chores

* Perform November monthly check 🔧 ([6aceb38](https://github.com/paraspell/xcm-tools/commit/6aceb38be5fd65c9f7dbfd037bdcc947c9cf37d8))

## [1.4.1](https://github.com/paraspell/xcm-tools/compare/xcm-router-v1.4.0...xcm-router-v1.4.1) (2024-11-01)


### Bug Fixes

* **playground:** Remove Ethereum option from some selects ✨ ([825702e](https://github.com/paraspell/xcm-tools/commit/825702e55f2cfab2d52f0c3c6bfcab7904b285a5))


### Documentation

* Add TSDoc reference comments to exported functions 📄 ([73b8cfe](https://github.com/paraspell/xcm-tools/commit/73b8cfe6d0944a0ea2c649552c844501ad10b19c))


### Miscellaneous Chores

* Add consistent type imports ESlint rule ✏️ ([61c20ae](https://github.com/paraspell/xcm-tools/commit/61c20ae24b83d871a6a5e3819e09748df3026061))
* Perform a monthly check 🛠️ ([46a8802](https://github.com/paraspell/xcm-tools/commit/46a8802cb68a49b28f131b337e5b4b4731e01fd4))
* **xcm-tools:** Add starter template projects to readme ([8e9cbf7](https://github.com/paraspell/xcm-tools/commit/8e9cbf7f6a8c25e7bf7dd48287d0dd66557c4c02))


### Tests

* Improve overall unit test coverage to above 90% 🧪 ([aeb32bb](https://github.com/paraspell/xcm-tools/commit/aeb32bb6a54c1bc2e527cf587b8e0a44e3c397a5))

## [1.4.0](https://github.com/paraspell/xcm-tools/compare/xcm-router-v1.3.0...xcm-router-v1.4.0) (2024-09-30)


### Features

* **xcm-router:** Refactor currency inputs ✨ ([28db4a9](https://github.com/paraspell/xcm-tools/commit/28db4a918f896f496a5b8c984d9f0413d6f827ae))


### Bug Fixes

* Fix ignored ESlint errors 🔧 ([495fc06](https://github.com/paraspell/xcm-tools/commit/495fc067758db128df1d0c46c1c2534dc28aaf3f))


### Miscellaneous Chores

* Perform monthly maintenance check 🛠️ ([e85ed15](https://github.com/paraspell/xcm-tools/commit/e85ed15e709ccf3b59f7aa8c0fcaf7134e0fe8a3))
* Update readme ([fd92c72](https://github.com/paraspell/xcm-tools/commit/fd92c72edcf16ec4450606f0e5938cf1f5a3bc01))


### Continuous Integration

* Setup Codecov bundle analysis 📦 ([c3e0e53](https://github.com/paraspell/xcm-tools/commit/c3e0e535cef0e2d8dd77035cb10ee596163d54a0))

## [1.3.0](https://github.com/paraspell/xcm-tools/compare/xcm-router-v1.2.2...xcm-router-v1.3.0) (2024-08-30)


### Features

* Add Select component for selecting assets ([850483f](https://github.com/paraspell/xcm-tools/commit/850483fc75dbef266b46a5bbb15da8517985c620))
* **xcm-api:** Add support for XCM Router API Snowbridge transfers ([c468a80](https://github.com/paraspell/xcm-tools/commit/c468a804845fa3fd78649f01af7eee32a7305aae))
* **xcm-router:** Add Snowbridge transfers support ❄️ ([d69fda6](https://github.com/paraspell/xcm-tools/commit/d69fda6e723f3e7e7820c2eeaf2800975d43b53f))


### Bug Fixes

* **xcm-router:** Add missing methods to Router builder ([fac5bc0](https://github.com/paraspell/xcm-tools/commit/fac5bc01fb33bc1e54a8d7d99622efb27c218073))
* **xcm-router:** Add missing Router builder methods ([2048e9c](https://github.com/paraspell/xcm-tools/commit/2048e9c380b94ed788f0176ecb28276d551538f6))


### Miscellaneous Chores

* Perform montly check ✨ ([3f20805](https://github.com/paraspell/xcm-tools/commit/3f20805195f11ca9f37c57f1c6ee6e37c07f6edc))
* Remove unused standard-version package 🔨 ([f36f10c](https://github.com/paraspell/xcm-tools/commit/f36f10ccbdf67ec61fea78a9fe20030b5fcea705))
* **xcm-tools:** Update readme to reflect latest changes ([65c7a72](https://github.com/paraspell/xcm-tools/commit/65c7a72963eaf9eaba147a13c2b9da654d5cf8fb))


### Build System

* Update all package commands to use pnpm ([5478cf3](https://github.com/paraspell/xcm-tools/commit/5478cf3166613eb7fdd9571bc20811d45d1d2fcd))


### Continuous Integration

* Integrate Codecov PR comments 💬 ([220da1b](https://github.com/paraspell/xcm-tools/commit/220da1b6d060b7aa4d8262e779256e40ce145f3f))

## [1.2.2](https://github.com/paraspell/xcm-tools/compare/xcm-router-v1.2.1...xcm-router-v1.2.2) (2024-07-27)

### Miscellaneous Chores

- **sdk:** Perform monthly maintenance check 🛠️ ([71e0bdd](https://github.com/paraspell/xcm-tools/commit/71e0bdd6e4df2c87bb428a66d6dea637131f27c1))
- Update docs ([1cea10f](https://github.com/paraspell/xcm-tools/commit/1cea10f78a1377ce4526dba7a54ad3a806afc024))
- Update Polkadot dependencies to latest version ([319ec70](https://github.com/paraspell/xcm-tools/commit/319ec70e4f3771f0ca339f770d6474a8fcceb8ed))

### Code Refactoring

- Upgrade ESlint to v9 & create shared config ([524161b](https://github.com/paraspell/xcm-tools/commit/524161b9a9509c3beb15af99bfc0151c7eeb5619))

## [1.2.1](https://github.com/paraspell/xcm-tools/compare/xcm-router-v1.2.0...xcm-router-v1.2.1) (2024-06-30)

### Miscellaneous Chores

- Perform monthly maintenance check ([5b1b76a](https://github.com/paraspell/xcm-tools/commit/5b1b76a249d52568488242908581fe061dee2750))

## [1.2.0](https://github.com/paraspell/xcm-tools/compare/xcm-router-v1.1.1...xcm-router-v1.2.0) (2024-06-30)

### Features

- Add support for Polkadot and Kusama bridge ([0b935fe](https://github.com/paraspell/xcm-tools/commit/0b935fecf6e49e7e58abb1efee239bce53126a0b))
- **xcm-router:** Add support for EVM signer ([569f4fc](https://github.com/paraspell/xcm-tools/commit/569f4fc3e0316df4ac82a1b4f3714a7528548c14))
- **xcm-router:** Remove Mangata DEX ([b601bbf](https://github.com/paraspell/xcm-tools/commit/b601bbffc8ba285b159c14cc395dc27594f1a068))

### Bug Fixes

- Fix WS endpoints timing out ([32f34b8](https://github.com/paraspell/xcm-tools/commit/32f34b8eecaf46be06b968bbd97b817860dd8e52))
- Properly handle smaller amounts in exchanges ([6004c13](https://github.com/paraspell/xcm-tools/commit/6004c137c470719ed5d3f9c138c59a187b6e42a2))
- **xcm-router:** Fix handling small amounts before sending XCM to exchange ([ae27b5b](https://github.com/paraspell/xcm-tools/commit/ae27b5b4bbbce3ad9bfa656ce5cea1186de067e9))

### Miscellaneous Chores

- Update Node.js to v20 LTS ([4b00caa](https://github.com/paraspell/xcm-tools/commit/4b00caa58649051f4dea57e7f6ebb94baa6e307a))
- **xcm-router:** Update all dependencies ([b71eaec](https://github.com/paraspell/xcm-tools/commit/b71eaec3ee5c2fb2a73e37e2b0fb3013a2d53b95))
- **xcm-router:** Update README.md ([0b24925](https://github.com/paraspell/xcm-tools/commit/0b2492503dc573379ec2f1b988939bf89316133a))

### Code Refactoring

- **xcm-router:** Reduce unit tests code duplication & add tests for small amount error ([384803d](https://github.com/paraspell/xcm-tools/commit/384803da3528087124fe2f2182d7d4ee8fdf9120))

## [1.1.1](https://github.com/paraspell/xcm-tools/compare/xcm-router-v1.1.0...xcm-router-v1.1.1) (2024-04-30)

### Miscellaneous Chores

- **sdk:** Perform monthly check ⚙️ ([0edf441](https://github.com/paraspell/xcm-tools/commit/0edf441af391711f4884032a8ed0f9c3b1818cc6))
- **xcm-router:** Update License ([1422afe](https://github.com/paraspell/xcm-tools/commit/1422afe61d08cb9083fa3d724e900b1f7d54ec86))

## [1.1.0](https://github.com/paraspell/xcm-tools/compare/xcm-router-v1.0.0...xcm-router-v1.1.0) (2024-04-13)

### Features

- **sdk:** Add MultiLocation override feature ⛓️ ([eb6cdbe](https://github.com/paraspell/xcm-tools/commit/eb6cdbedd8bdfb2570e0bc94192afe6079a20b11))

## [1.0.0](https://github.com/paraspell/xcm-tools/compare/xcm-router-v0.1.1...xcm-router-v1.0.0) (2024-04-02)

### ⚠ BREAKING CHANGES

- **sdk:** Refactor public functions to use parameter object ⚙️

### Bug Fixes

- **router:** Update README.md ([4cef3e2](https://github.com/paraspell/xcm-tools/commit/4cef3e2f644d4d27df6ec6f2490c64a66cc7da4f))

### Miscellaneous Chores

- **sdk:** Monthly check ✨ ([bee15fb](https://github.com/paraspell/xcm-tools/commit/bee15fb231932705bdfcdb14a13770b8f566035d))

### Code Refactoring

- **sdk:** Refactor public functions to use parameter object ⚙️ ([53e81b5](https://github.com/paraspell/xcm-tools/commit/53e81b56523e14e90f5f1ffc0103cb2bd9420c08))

## [0.1.1](https://github.com/paraspell/xcm-tools/compare/xcm-router-v0.1.0...xcm-router-v0.1.1) (2024-02-25)

### Bug Fixes

- Add xcm router description ([70f674c](https://github.com/paraspell/xcm-tools/commit/70f674c84693814073a33f9ec38548fa83e3b782))

### Miscellaneous Chores

- **main:** release xcm-router 0.1.0 ([#153](https://github.com/paraspell/xcm-tools/issues/153)) ([7d3380c](https://github.com/paraspell/xcm-tools/commit/7d3380c5edbae22515d7991578e48d73988df86b))

## [0.1.0](https://github.com/paraspell/xcm-tools/compare/xcm-router-v0.0.9...xcm-router-v0.1.0) (2024-02-21)

### Features

- Migrate to a pnpm monorepo 🗂️ ([e8dc883](https://github.com/paraspell/xcm-tools/commit/e8dc883900ab2cc31e293efd205e93478619e572))

### [0.0.9](https://github.com-absolonmm/paraspell/xcm-router/compare/v0.0.8...v0.0.9) (2024-01-30)

### Bug Fixes

- Fork Interlay SDK and fix circular dependency ([c8bbaef](https://github.com-absolonmm/paraspell/xcm-router/commit/c8bbaeffbbb34f5628ea4e20ed59dc0b00be706d))
- Update @galacticcouncil/sdk & remove patch ([c695e3b](https://github.com-absolonmm/paraspell/xcm-router/commit/c695e3b1b498508c49caebe9715ba9f4fad331ec))

### [0.0.8](https://github.com/paraspell/xcm-router/compare/v0.0.7...v0.0.8) (2024-01-26)

### [0.0.7](https://github.com-absolonmm/paraspell/xcm-router/compare/v0.0.6...v0.0.7) (2024-01-25)

### Bug Fixes

- Fix error ExtrinsicStatus:: 1010 not shown in UI ([e57b71a](https://github.com-absolonmm/paraspell/xcm-router/commit/e57b71a869a11a73293693031d63aae3ce9224a4))

### [0.0.6](https://github.com-absolonmm/paraspell/xcm-router/compare/v0.0.5...v0.0.6) (2024-01-08)

### [0.0.5](https://github.com-absolonmm/paraspell/xcm-router/compare/v0.0.4...v0.0.5) (2023-12-22)

### [0.0.4](https://github.com-absolonmm/paraspell/xcm-router/compare/v0.0.3...v0.0.4) (2023-12-22)

### [0.0.3](https://github.com-absolonmm/paraspell/xcm-router/compare/v0.0.2...v0.0.3) (2023-12-21)

### [0.0.2](https://github.com-absolonmm/paraspell/xcm-router/compare/v0.0.1...v0.0.2) (2023-12-18)

### 0.0.1 (2023-12-15)
