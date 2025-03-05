# Changelog

## [8.6.1](https://github.com/paraspell/xcm-tools/compare/sdk-core-v8.6.0...sdk-core-v8.6.1) (2025-03-05)


### Bug Fixes

* **sdk-core:** Validate sender address in dry-run function 🛠️ ([f71efde](https://github.com/paraspell/xcm-tools/commit/f71efde6c1419bf15f5e9b8775d901483d410731))


### Code Refactoring

* Improve builder type safety 🔧 ([41389de](https://github.com/paraspell/xcm-tools/commit/41389dee44246fc83d46f45512f97433fd773b50))

## [8.6.0](https://github.com/paraspell/xcm-tools/compare/sdk-core-v8.5.3...sdk-core-v8.6.0) (2025-02-28)


### Features

* **sdk-core:** Add function for querying dry-run support 🪄 ([a6d3b8d](https://github.com/paraspell/xcm-tools/commit/a6d3b8d30acfb9af0d77788243da8813ca4d662c))
* **xcm-router:** Add support for AssetHub DEX ✨ ([274ad41](https://github.com/paraspell/xcm-tools/commit/274ad41d8e7f70f327d2918a8d2fd0aca5374101))


### Miscellaneous Chores

* Perform monthly check 🔧 ([fdcb194](https://github.com/paraspell/xcm-tools/commit/fdcb194681947b4e92ff8b34ebd7b3c84e6d0048))


### Code Refactoring

* **playground:** Use automatic api creation ✨ ([0caa420](https://github.com/paraspell/xcm-tools/commit/0caa4204fc35970c4461df975510f01246556a1d))
* **sdk-core:** Improve currency related types 🪛 ([aad04ba](https://github.com/paraspell/xcm-tools/commit/aad04ba0854a8fd25aa1f7828bb4fe172b8635a4))

## [8.5.3](https://github.com/paraspell/xcm-tools/compare/sdk-core-v8.5.2...sdk-core-v8.5.3) (2025-02-25)


### Bug Fixes

* Add PAPI support for Moonbeam -&gt; Ethereum transfer ✨ ([84b80c3](https://github.com/paraspell/xcm-tools/commit/84b80c3539106313b6cfa90279f1eee249ecabdd))
* Remove ahAddress field in favor of senderAddress & Router fixes 🔧 ([9c2680a](https://github.com/paraspell/xcm-tools/commit/9c2680afe64caec8b7e91b2e1a584cf8e527eb8e))
* **sdk-core:** Add complete multi-locations for AH assets ([8d5e2ce](https://github.com/paraspell/xcm-tools/commit/8d5e2ce855f9becd5afb446d88e36111ec8bf47f))

## [8.5.2](https://github.com/paraspell/xcm-tools/compare/sdk-core-v8.5.1...sdk-core-v8.5.2) (2025-02-21)


### Bug Fixes

* **sdk-core:** Accept public key address 📇 ([46ed82d](https://github.com/paraspell/xcm-tools/commit/46ed82d6c140b2a02d5449e10b2d3df0a49f10cd))


### Build System

* **xcm-router:** Update Bifrost DEX SDK 📦 ([fe85f27](https://github.com/paraspell/xcm-tools/commit/fe85f273c6371c27a97e86c57d59b8913f5bff68))

## [8.5.1](https://github.com/paraspell/xcm-tools/compare/sdk-core-v8.5.0...sdk-core-v8.5.1) (2025-02-19)


### Bug Fixes

* **sdk-core:** Add multi-locations to native assets ([8e40da1](https://github.com/paraspell/xcm-tools/commit/8e40da1450722e37de7cf0365a806e424b58c453))

## [8.5.0](https://github.com/paraspell/xcm-tools/compare/sdk-core-v8.4.2...sdk-core-v8.5.0) (2025-02-18)


### Features

* Add eth fee function & new transfers ✨ ([0ec3c78](https://github.com/paraspell/xcm-tools/commit/0ec3c78e449c58640b4f439eeb5a32b332d70e92))

## [8.4.2](https://github.com/paraspell/xcm-tools/compare/sdk-core-v8.4.1...sdk-core-v8.4.2) (2025-02-17)


### Bug Fixes

* **sdk-core:** Fix AssetHub fee calculation 🛠️ ([971db0d](https://github.com/paraspell/xcm-tools/commit/971db0d92453d11bc7bba5398e833cee6f51d98b))

## [8.4.1](https://github.com/paraspell/xcm-tools/compare/sdk-core-v8.4.0...sdk-core-v8.4.1) (2025-02-14)


### Bug Fixes

* **sdk-core:** Randomize multiple ws providers for Hydration 🔧 ([78242e9](https://github.com/paraspell/xcm-tools/commit/78242e9632182694ce46331b26653e97fb61dd59))

## [8.4.0](https://github.com/paraspell/xcm-tools/compare/sdk-core-v8.3.1...sdk-core-v8.4.0) (2025-02-13)


### Features

* Add support for new Snowbridge routes ✨ ([cd87b23](https://github.com/paraspell/xcm-tools/commit/cd87b23193c0fd84d09e33e0892e97c6646fedc4))

## [8.3.1](https://github.com/paraspell/xcm-tools/compare/sdk-core-v8.3.0...sdk-core-v8.3.1) (2025-02-11)


### Bug Fixes

* **sdk-core:** Fix incorrect type for getOriginFee function 🔧 ([7bd0128](https://github.com/paraspell/xcm-tools/commit/7bd01286ada88028ca5567233b5b82c3a306e5d6))

## [8.3.0](https://github.com/paraspell/xcm-tools/compare/sdk-core-v8.2.2...sdk-core-v8.3.0) (2025-02-11)


### Features

* **sdk:** Add getAssetMultiLocation function ✨ ([60161ab](https://github.com/paraspell/xcm-tools/commit/60161ab4fa668d9d658665ba54e449a31f2406ce))


### Bug Fixes

* **xcm-router:** Modify fee calculations ([9e0f19b](https://github.com/paraspell/xcm-tools/commit/9e0f19bab007b58033dacde352e2529530b380b5))


### Code Refactoring

* **xcm-router:** Improve asset selection and validation 🪄 ([138f633](https://github.com/paraspell/xcm-tools/commit/138f633fbe3e2de851dd70be305e792208350320))

## [8.2.2](https://github.com/paraspell/xcm-tools/compare/sdk-core-v8.2.1...sdk-core-v8.2.2) (2025-02-08)


### Bug Fixes

* **sdk-pjs:** Fix Snowbridge transfers not working for some wallets 🔧 ([b846b70](https://github.com/paraspell/xcm-tools/commit/b846b708e90675b3e47c3da1b2142a1ef2528f0a))

## [8.2.1](https://github.com/paraspell/xcm-tools/compare/sdk-core-v8.2.0...sdk-core-v8.2.1) (2025-01-27)


### Bug Fixes

* **sdk-core:** Fix dry run 🔧 ([7864be5](https://github.com/paraspell/xcm-tools/commit/7864be50ff1de8a398920e44a6d4eb2bcbc217a7))

## [8.2.0](https://github.com/paraspell/xcm-tools/compare/sdk-core-v8.1.0...sdk-core-v8.2.0) (2025-01-25)


### Features

* **playground:** Improve playground ✨ ([441fa6f](https://github.com/paraspell/xcm-tools/commit/441fa6fb197f2b8f35f34c14fd8f94dcdc15635d))


### Bug Fixes

* Fix batch transfers for PAPI & Improve playground symbol selection ✨ ([e6f38b1](https://github.com/paraspell/xcm-tools/commit/e6f38b17bdb7dd9cdc6d898485c7ba2a2ed8e191))
* **playground:** Improve mobile responsivity📱 ([ecdf91b](https://github.com/paraspell/xcm-tools/commit/ecdf91b14882b72b637f800cd76d08f1ecf8f6aa))


### Miscellaneous Chores

* Perform monthly check 🔧 ([b459bc4](https://github.com/paraspell/xcm-tools/commit/b459bc48044711b02e3ed1bf0ea1d9ddecd32098))

## [8.1.0](https://github.com/paraspell/xcm-tools/compare/sdk-core-v8.0.3...sdk-core-v8.1.0) (2025-01-16)


### Features

* **sdk-core:** Add builder method for api disconnecting & Update docs ([5771425](https://github.com/paraspell/xcm-tools/commit/5771425b5c33ae788c03171d5c27c755a9add1d1))


### Bug Fixes

* Add missing assets ✨ ([d33347c](https://github.com/paraspell/xcm-tools/commit/d33347c7cd3b279239c9d7c7dbf7511f6424937f))


### Code Refactoring

* **xcm-api:** Use automatic api creating ✨ ([3e840b1](https://github.com/paraspell/xcm-tools/commit/3e840b1ab1d141c97bfd6322d83a62d4199d9305))


### Tests

* Refactor and improve SDK e2e tests 🧪 ([7220d0d](https://github.com/paraspell/xcm-tools/commit/7220d0dc529ab7e08a35cc3cb2e87e5569634792))

## [8.0.3](https://github.com/paraspell/xcm-tools/compare/sdk-core-v8.0.2...sdk-core-v8.0.3) (2025-01-06)


### Bug Fixes

* Fix package json warnings 🔧 ([de6ea5d](https://github.com/paraspell/xcm-tools/commit/de6ea5df89513753b7a83e4053121a4b207a97c5))


### Code Refactoring

* **sdk-core:** Refactor parachainId resolving 🔧 ([425a1b3](https://github.com/paraspell/xcm-tools/commit/425a1b3a21de29269b74e472f19efd32e0e9eff9))

## [8.0.2](https://github.com/paraspell/xcm-tools/compare/sdk-core-v8.0.1...sdk-core-v8.0.2) (2025-01-03)


### Bug Fixes

* Improve EVM builder ✨ ([76afbf3](https://github.com/paraspell/xcm-tools/commit/76afbf3505460fbe85d4a91190a45e14cd8f2491))

## [8.0.1](https://github.com/paraspell/xcm-tools/compare/sdk-core-v8.0.0...sdk-core-v8.0.1) (2025-01-03)


### Bug Fixes

* Enable support for bigint literals ✨ ([0090106](https://github.com/paraspell/xcm-tools/commit/0090106babe2dcecf66d4eaa532d3963a230958b))
* Fix assets export 🛠️ ([cdf1d03](https://github.com/paraspell/xcm-tools/commit/cdf1d03a90e11c9f15a76c6fd77475f89e71d536))
* **sdk-core:** Remove keep alive feature 🔧 ([5d7761e](https://github.com/paraspell/xcm-tools/commit/5d7761ede0c87e7b6c00e4d1f416323409211870))
* Update Rollup TypeScript plugin to official version ⬆ ([20c0f25](https://github.com/paraspell/xcm-tools/commit/20c0f25224a86b859ac1ad043c5cf04febdf743e))

## [8.0.0](https://github.com/paraspell/xcm-tools/compare/sdk-core-v7.2.10...sdk-core-v8.0.0) (2024-12-29)


### ⚠ BREAKING CHANGES

* Split SDK into separate packages for PJS and PAPI ✨

### Features

* **sdk-core:** Add support for pallet/method override ✨ ([aa11c6b](https://github.com/paraspell/xcm-tools/commit/aa11c6b0b8484b7566d76b6d2c6bf1821b840b6d))
* Split SDK into separate packages for PJS and PAPI ✨ ([ff465e9](https://github.com/paraspell/xcm-tools/commit/ff465e92e57640f525c7d350afec0b9dcf364453))


### Bug Fixes

* **sdk-core:** Update folder structure 📁 ([a233074](https://github.com/paraspell/xcm-tools/commit/a233074e2f096e7e9d2194c7142bd7bac877bfc7))


### Miscellaneous Chores

* Perform monthly maintenance check  👨‍🔧 ([a85c3bd](https://github.com/paraspell/xcm-tools/commit/a85c3bd427b6d1d829155bf32a4524637eb78a1f))
* **xcm-tools:** Update readme ([c10bdbb](https://github.com/paraspell/xcm-tools/commit/c10bdbb8ce16b5e8700c30f8b82d1912f604b966))

## Changelog
