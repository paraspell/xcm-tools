# Changelog

## [9.0.0](https://github.com/paraspell/xcm-tools/compare/sdk-core-v8.9.1...sdk-core-v9.0.0) (2025-03-24)


### ⚠ BREAKING CHANGES

* Split SDK into separate packages for PJS and PAPI ✨

### Features

* Add eth fee function & new transfers ✨ ([0ec3c78](https://github.com/paraspell/xcm-tools/commit/0ec3c78e449c58640b4f439eeb5a32b332d70e92))
* Add support for new Snowbridge routes ✨ ([cd87b23](https://github.com/paraspell/xcm-tools/commit/cd87b23193c0fd84d09e33e0892e97c6646fedc4))
* **playground:** Improve playground ✨ ([441fa6f](https://github.com/paraspell/xcm-tools/commit/441fa6fb197f2b8f35f34c14fd8f94dcdc15635d))
* **sdk-core:** Add builder method for api disconnecting & Update docs ([5771425](https://github.com/paraspell/xcm-tools/commit/5771425b5c33ae788c03171d5c27c755a9add1d1))
* **sdk-core:** Add function for querying dry-run support 🪄 ([a6d3b8d](https://github.com/paraspell/xcm-tools/commit/a6d3b8d30acfb9af0d77788243da8813ca4d662c))
* **sdk-core:** Add support for additional &lt;&gt;Polimec transfers 🪄 ([600e0e6](https://github.com/paraspell/xcm-tools/commit/600e0e6935bcac72d98b92b0c68b2a92669934e4))
* **sdk-core:** Add support for additional &lt;&gt;Polimec transfers 🪄 ([7cb2768](https://github.com/paraspell/xcm-tools/commit/7cb27684676642704314922c12a8347576da6d0f))
* **sdk-core:** Add support for pallet/method override ✨ ([aa11c6b](https://github.com/paraspell/xcm-tools/commit/aa11c6b0b8484b7566d76b6d2c6bf1821b840b6d))
* **sdk-core:** Add support for PolkadotXCM execute transfers ✨ ([7387c96](https://github.com/paraspell/xcm-tools/commit/7387c96ab45dbc4e20cfa8254f808c5d621504b7))
* **sdk-core:** Add support for PolkadotXCM execute transfers ✨ ([3fee6ac](https://github.com/paraspell/xcm-tools/commit/3fee6ac6f45808758ebcbf1fedddbd3e825bcbd2))
* **sdk:** Add getAssetMultiLocation function ✨ ([60161ab](https://github.com/paraspell/xcm-tools/commit/60161ab4fa668d9d658665ba54e449a31f2406ce))
* Split SDK into separate packages for PJS and PAPI ✨ ([ff465e9](https://github.com/paraspell/xcm-tools/commit/ff465e92e57640f525c7d350afec0b9dcf364453))
* **xcm-router:** Add support for AssetHub DEX ✨ ([274ad41](https://github.com/paraspell/xcm-tools/commit/274ad41d8e7f70f327d2918a8d2fd0aca5374101))
* **xcm-router:** Add support for precise exchange auto-select ✨ ([ee018a3](https://github.com/paraspell/xcm-tools/commit/ee018a38f72cba5b8e20b4f7d537a6ad4027f92a))
* **xcm-router:** Add support for precise exchange auto-select ✨ ([18d65d8](https://github.com/paraspell/xcm-tools/commit/18d65d8dead2ef68c71e956a41ea0b1dcca3993b))


### Bug Fixes

* Add missing assets ✨ ([d33347c](https://github.com/paraspell/xcm-tools/commit/d33347c7cd3b279239c9d7c7dbf7511f6424937f))
* Add PAPI support for Moonbeam -&gt; Ethereum transfer ✨ ([84b80c3](https://github.com/paraspell/xcm-tools/commit/84b80c3539106313b6cfa90279f1eee249ecabdd))
* Enable support for bigint literals ✨ ([0090106](https://github.com/paraspell/xcm-tools/commit/0090106babe2dcecf66d4eaa532d3963a230958b))
* Fix assets export 🛠️ ([cdf1d03](https://github.com/paraspell/xcm-tools/commit/cdf1d03a90e11c9f15a76c6fd77475f89e71d536))
* Fix batch transfers for PAPI & Improve playground symbol selection ✨ ([e6f38b1](https://github.com/paraspell/xcm-tools/commit/e6f38b17bdb7dd9cdc6d898485c7ba2a2ed8e191))
* Fix ESlint errors & Update Snowbridge SDK ([9049acc](https://github.com/paraspell/xcm-tools/commit/9049acc68991a89174199cb799f4d3a9756cf855))
* Fix package json warnings 🔧 ([de6ea5d](https://github.com/paraspell/xcm-tools/commit/de6ea5df89513753b7a83e4053121a4b207a97c5))
* Improve EVM builder ✨ ([76afbf3](https://github.com/paraspell/xcm-tools/commit/76afbf3505460fbe85d4a91190a45e14cd8f2491))
* **playground:** Improve mobile responsivity📱 ([ecdf91b](https://github.com/paraspell/xcm-tools/commit/ecdf91b14882b72b637f800cd76d08f1ecf8f6aa))
* Remove ahAddress field in favor of senderAddress & Router fixes 🔧 ([9c2680a](https://github.com/paraspell/xcm-tools/commit/9c2680afe64caec8b7e91b2e1a584cf8e527eb8e))
* **sdk-core:** Accept public key address 📇 ([46ed82d](https://github.com/paraspell/xcm-tools/commit/46ed82d6c140b2a02d5449e10b2d3df0a49f10cd))
* **sdk-core:** Add complete multi-locations for AH assets ([8d5e2ce](https://github.com/paraspell/xcm-tools/commit/8d5e2ce855f9becd5afb446d88e36111ec8bf47f))
* **sdk-core:** Add multi-locations to native assets ([8e40da1](https://github.com/paraspell/xcm-tools/commit/8e40da1450722e37de7cf0365a806e424b58c453))
* **sdk-core:** Fix AH -&gt; system chains transfers 🔧 ([e65d436](https://github.com/paraspell/xcm-tools/commit/e65d436721c02cf4cb32b2444906d1cf00b2bb5d))
* **sdk-core:** Fix AssetHub fee calculation 🛠️ ([971db0d](https://github.com/paraspell/xcm-tools/commit/971db0d92453d11bc7bba5398e833cee6f51d98b))
* **sdk-core:** Fix dry run 🔧 ([7864be5](https://github.com/paraspell/xcm-tools/commit/7864be50ff1de8a398920e44a6d4eb2bcbc217a7))
* **sdk-core:** Fix failing e2e tests 🧪 ([5c8785b](https://github.com/paraspell/xcm-tools/commit/5c8785bbd3cb675826fc6f0a31cd8230e86811a3))
* **sdk-core:** Fix failing e2e tests 🧪 ([3b2d097](https://github.com/paraspell/xcm-tools/commit/3b2d0973958eee78e5f802300cb5c57ab8ec8188))
* **sdk-core:** Fix incorrect type for getOriginFee function 🔧 ([7bd0128](https://github.com/paraspell/xcm-tools/commit/7bd01286ada88028ca5567233b5b82c3a306e5d6))
* **sdk-core:** Fix Polimec foreign assets fetching 🪙 ([00ebcc5](https://github.com/paraspell/xcm-tools/commit/00ebcc52edfaba51a848b38fffd3f1f37ab457c5))
* **sdk-core:** Fix Polimec foreign assets fetching 🪙 ([d5530bb](https://github.com/paraspell/xcm-tools/commit/d5530bb21278355c7c77eae15e4f5b68d2452baf))
* **sdk-core:** Fix Polkadot -&gt; Polimec transfer 🔧 ([2c508a4](https://github.com/paraspell/xcm-tools/commit/2c508a44ad6f92be2427d3fbcb84bcfbcfc6a448))
* **sdk-core:** Fix Polkadot -&gt; Polimec transfer 🔧 ([ef5ac26](https://github.com/paraspell/xcm-tools/commit/ef5ac263afdc6d6418ab495a9f09449ba994f014))
* **sdk-core:** Randomize multiple ws providers for Hydration 🔧 ([78242e9](https://github.com/paraspell/xcm-tools/commit/78242e9632182694ce46331b26653e97fb61dd59))
* **sdk-core:** Remove Hydration non RPC compliant endpoint 🧹 ([c9af914](https://github.com/paraspell/xcm-tools/commit/c9af91438de7e01207d867172b8a56fb112f4397))
* **sdk-core:** Remove keep alive feature 🔧 ([5d7761e](https://github.com/paraspell/xcm-tools/commit/5d7761ede0c87e7b6c00e4d1f416323409211870))
* **sdk-core:** Update folder structure 📁 ([a233074](https://github.com/paraspell/xcm-tools/commit/a233074e2f096e7e9d2194c7142bd7bac877bfc7))
* **sdk-core:** Validate sender address in dry-run function 🛠️ ([f71efde](https://github.com/paraspell/xcm-tools/commit/f71efde6c1419bf15f5e9b8775d901483d410731))
* **sdk-pjs:** Fix Snowbridge transfers not working for some wallets 🔧 ([b846b70](https://github.com/paraspell/xcm-tools/commit/b846b708e90675b3e47c3da1b2142a1ef2528f0a))
* Update Rollup TypeScript plugin to official version ⬆ ([20c0f25](https://github.com/paraspell/xcm-tools/commit/20c0f25224a86b859ac1ad043c5cf04febdf743e))
* **xcm-router:** Modify fee calculations ([9e0f19b](https://github.com/paraspell/xcm-tools/commit/9e0f19bab007b58033dacde352e2529530b380b5))


### Miscellaneous Chores

* **main:** release main libraries ([e49d724](https://github.com/paraspell/xcm-tools/commit/e49d72434cec8fc28edb55b2afc195f24a18718b))
* **main:** release main libraries ([f84aa87](https://github.com/paraspell/xcm-tools/commit/f84aa8738812d3c90984599c51ddad5661a69129))
* **main:** release main libraries ([d43690c](https://github.com/paraspell/xcm-tools/commit/d43690c8b28ae651e8bcd002e415b3c929d6190d))
* **main:** release main libraries ([9381e35](https://github.com/paraspell/xcm-tools/commit/9381e3511f57bc9b5c6d98fdc4c8eec6acfcce66))
* **main:** release main libraries ([f6d7433](https://github.com/paraspell/xcm-tools/commit/f6d743313b4d856069af02fbc9e6627377f340ae))
* **main:** release main libraries ([2d37e2c](https://github.com/paraspell/xcm-tools/commit/2d37e2cd197fe336af58c5a1c8396b91a147cc3d))
* **main:** release main libraries ([47a7aef](https://github.com/paraspell/xcm-tools/commit/47a7aefd7b57cc76a92dcfcb01f37dcfe152e9a4))
* **main:** release main libraries ([b6c1909](https://github.com/paraspell/xcm-tools/commit/b6c19095fc0ec3507f3388bd73381126a29d2336))
* **main:** release main libraries ([0ea7489](https://github.com/paraspell/xcm-tools/commit/0ea74897682d7fc6519a05c69852a4f14ae3a881))
* **main:** release main libraries ([d8a0439](https://github.com/paraspell/xcm-tools/commit/d8a04394fefc3a4ebc50af11c2b9a5f418a3f2c7))
* **main:** release main libraries ([bef599f](https://github.com/paraspell/xcm-tools/commit/bef599f8eb516d7d7fc2bc730e647479784c112c))
* **main:** release main libraries ([588f49a](https://github.com/paraspell/xcm-tools/commit/588f49a892142898e2ce4eb18edf970ff71a771b))
* **main:** release main libraries ([34067ae](https://github.com/paraspell/xcm-tools/commit/34067aef14ba20f06e441240e0ff30b9821d98b4))
* **main:** release SDKgroup libraries ([a4e6b50](https://github.com/paraspell/xcm-tools/commit/a4e6b50495dbc959c5cb42b0f3783a2729d92f9e))
* **main:** release SDKgroup libraries ([0b52fc9](https://github.com/paraspell/xcm-tools/commit/0b52fc95fdc273a4546bfc28b03e815efb34d750))
* **main:** release SDKgroup libraries ([f7bdaf2](https://github.com/paraspell/xcm-tools/commit/f7bdaf2cc324f2ac100937dc3c258e08dfdc8ff2))
* **main:** release SDKgroup libraries ([99c9a84](https://github.com/paraspell/xcm-tools/commit/99c9a84d443b33f5ed783b47dbcd69e59c407f57))
* **main:** release SDKgroup libraries ([65d4bd9](https://github.com/paraspell/xcm-tools/commit/65d4bd9032e71d4d876f8f926c33633a3b3bc041))
* **main:** release SDKgroup libraries ([57eb92b](https://github.com/paraspell/xcm-tools/commit/57eb92b905c6688bbedda2488b0856eca17b207b))
* **main:** release SDKgroup libraries ([331423c](https://github.com/paraspell/xcm-tools/commit/331423ce1cf93836d1d1427cda3f2b91138546da))
* **main:** release SDKgroup libraries ([8c6adef](https://github.com/paraspell/xcm-tools/commit/8c6adefd963a13b74198053d6e5cfa7246e53009))
* **main:** release SDKgroup libraries ([ba1cd01](https://github.com/paraspell/xcm-tools/commit/ba1cd018e48301e6b51e68e59ce68ad188ecbbd6))
* **main:** release SDKgroup libraries ([b5cf3dc](https://github.com/paraspell/xcm-tools/commit/b5cf3dcda7d2b0515716733491b2de1169956ad6))
* **main:** release SDKgroup libraries ([90a7d09](https://github.com/paraspell/xcm-tools/commit/90a7d09fac6fd83e728fa930e7d736747dbc8255))
* **main:** release SDKgroup libraries ([0304143](https://github.com/paraspell/xcm-tools/commit/030414329c06017f0d4da196e8e306e5dc60bef5))
* **main:** release SDKgroup libraries ([34d56b4](https://github.com/paraspell/xcm-tools/commit/34d56b4be825bae7c0e27fcb2a84f43d44e4ec76))
* **main:** release SDKgroup libraries ([d8c0cbf](https://github.com/paraspell/xcm-tools/commit/d8c0cbf58e7553e96672ae154e568978e4309a53))
* **main:** release SDKgroup libraries ([83a7cea](https://github.com/paraspell/xcm-tools/commit/83a7cea7010fe7e0088b4aa86a91caad1d28c3c0))
* **main:** release SDKgroup libraries ([27a4dec](https://github.com/paraspell/xcm-tools/commit/27a4dece10036065d511d91233ca8ad047cd2f34))
* **main:** release SDKgroup libraries ([f812065](https://github.com/paraspell/xcm-tools/commit/f812065e47b401a66cde29c49421cfaec8ea7329))
* **main:** release SDKgroup libraries ([ee0fb4a](https://github.com/paraspell/xcm-tools/commit/ee0fb4abc513f0f79d756aec3cf38acc2990eef8))
* Perform monthly check 🔧 ([fdcb194](https://github.com/paraspell/xcm-tools/commit/fdcb194681947b4e92ff8b34ebd7b3c84e6d0048))
* Perform monthly check 🔧 ([b459bc4](https://github.com/paraspell/xcm-tools/commit/b459bc48044711b02e3ed1bf0ea1d9ddecd32098))
* Perform monthly maintenance check  👨‍🔧 ([a85c3bd](https://github.com/paraspell/xcm-tools/commit/a85c3bd427b6d1d829155bf32a4524637eb78a1f))
* **xcm-tools:** Update readme ([c10bdbb](https://github.com/paraspell/xcm-tools/commit/c10bdbb8ce16b5e8700c30f8b82d1912f604b966))


### Code Refactoring

* Change multi-location type ✨ ([997e605](https://github.com/paraspell/xcm-tools/commit/997e605a1f5816ac44f4a18ee90859a677c55141))
* Create separate packages for assets and common code ✨ ([d1ed352](https://github.com/paraspell/xcm-tools/commit/d1ed3523e86219916e810fffa06e53b2a3ef96ea))
* Create separate packages for assets and common code e ✨ ([371b3ec](https://github.com/paraspell/xcm-tools/commit/371b3ec72558e2177c6d7129871820ad50a02a4e))
* Create separate pallets package 📦 ([62fa967](https://github.com/paraspell/xcm-tools/commit/62fa96753698ed2d5d5d21492c7d2447ad613006))
* Improve builder type safety 🔧 ([41389de](https://github.com/paraspell/xcm-tools/commit/41389dee44246fc83d46f45512f97433fd773b50))
* **playground:** Use automatic api creation ✨ ([0caa420](https://github.com/paraspell/xcm-tools/commit/0caa4204fc35970c4461df975510f01246556a1d))
* **sdk-core:** Improve currency related types 🪛 ([aad04ba](https://github.com/paraspell/xcm-tools/commit/aad04ba0854a8fd25aa1f7828bb4fe172b8635a4))
* **sdk-core:** Refactor beneficiary multi-location creation 🔧 ([d96e518](https://github.com/paraspell/xcm-tools/commit/d96e5186d243fa560138342fd9bdb4f7328bf156))
* **sdk-core:** Refactor beneficiary multi-location creation 🔧 ([bde4031](https://github.com/paraspell/xcm-tools/commit/bde4031ff28d90139da1557f9244b4833ceae817))
* **sdk-core:** Refactor override currency logic 🔧 ([6f4f636](https://github.com/paraspell/xcm-tools/commit/6f4f63685402907efb18b6346ce4c189773d219f))
* **sdk-core:** Refactor override currency logic 🔧 ([905e9c5](https://github.com/paraspell/xcm-tools/commit/905e9c5355fd7e0f1e8defbef34d4247e6b39f9d))
* **sdk-core:** Refactor parachainId resolving 🔧 ([425a1b3](https://github.com/paraspell/xcm-tools/commit/425a1b3a21de29269b74e472f19efd32e0e9eff9))
* **xcm-api:** Use automatic api creating ✨ ([3e840b1](https://github.com/paraspell/xcm-tools/commit/3e840b1ab1d141c97bfd6322d83a62d4199d9305))
* **xcm-router:** Improve asset selection and validation 🪄 ([138f633](https://github.com/paraspell/xcm-tools/commit/138f633fbe3e2de851dd70be305e792208350320))


### Tests

* Refactor and improve SDK e2e tests 🧪 ([7220d0d](https://github.com/paraspell/xcm-tools/commit/7220d0dc529ab7e08a35cc3cb2e87e5569634792))
* **sdk-core:** Add assets E2E tests 🧪 ([e3dee4e](https://github.com/paraspell/xcm-tools/commit/e3dee4edd4d80cb4a806ed711862e5b9e3bb862e))


### Build System

* Add sort-imports ESlint rule ✨ ([d9bd402](https://github.com/paraspell/xcm-tools/commit/d9bd4024ba87f6c8fedad012100ea76fdf7658c8))
* **xcm-router:** Update Bifrost DEX SDK 📦 ([fe85f27](https://github.com/paraspell/xcm-tools/commit/fe85f273c6371c27a97e86c57d59b8913f5bff68))

## [8.9.1](https://github.com/paraspell/xcm-tools/compare/sdk-core-v8.9.0...sdk-core-v8.9.1) (2025-03-24)


### Code Refactoring

* **sdk-core:** Refactor beneficiary multi-location creation 🔧 ([d96e518](https://github.com/paraspell/xcm-tools/commit/d96e5186d243fa560138342fd9bdb4f7328bf156))
* **sdk-core:** Refactor beneficiary multi-location creation 🔧 ([bde4031](https://github.com/paraspell/xcm-tools/commit/bde4031ff28d90139da1557f9244b4833ceae817))

## [8.9.0](https://github.com/paraspell/xcm-tools/compare/sdk-core-v8.8.0...sdk-core-v8.9.0) (2025-03-18)


### Features

* **sdk-core:** Add support for additional &lt;&gt;Polimec transfers 🪄 ([600e0e6](https://github.com/paraspell/xcm-tools/commit/600e0e6935bcac72d98b92b0c68b2a92669934e4))
* **sdk-core:** Add support for additional &lt;&gt;Polimec transfers 🪄 ([7cb2768](https://github.com/paraspell/xcm-tools/commit/7cb27684676642704314922c12a8347576da6d0f))


### Bug Fixes

* Fix ESlint errors & Update Snowbridge SDK ([9049acc](https://github.com/paraspell/xcm-tools/commit/9049acc68991a89174199cb799f4d3a9756cf855))
* **sdk-core:** Fix failing e2e tests 🧪 ([5c8785b](https://github.com/paraspell/xcm-tools/commit/5c8785bbd3cb675826fc6f0a31cd8230e86811a3))
* **sdk-core:** Fix failing e2e tests 🧪 ([3b2d097](https://github.com/paraspell/xcm-tools/commit/3b2d0973958eee78e5f802300cb5c57ab8ec8188))


### Code Refactoring

* Change multi-location type ✨ ([997e605](https://github.com/paraspell/xcm-tools/commit/997e605a1f5816ac44f4a18ee90859a677c55141))
* Create separate packages for assets and common code ✨ ([d1ed352](https://github.com/paraspell/xcm-tools/commit/d1ed3523e86219916e810fffa06e53b2a3ef96ea))
* Create separate packages for assets and common code e ✨ ([371b3ec](https://github.com/paraspell/xcm-tools/commit/371b3ec72558e2177c6d7129871820ad50a02a4e))
* Create separate pallets package 📦 ([62fa967](https://github.com/paraspell/xcm-tools/commit/62fa96753698ed2d5d5d21492c7d2447ad613006))

## [8.8.0](https://github.com/paraspell/xcm-tools/compare/sdk-core-v8.7.1...sdk-core-v8.8.0) (2025-03-13)


### Features

* **xcm-router:** Add support for precise exchange auto-select ✨ ([ee018a3](https://github.com/paraspell/xcm-tools/commit/ee018a38f72cba5b8e20b4f7d537a6ad4027f92a))
* **xcm-router:** Add support for precise exchange auto-select ✨ ([18d65d8](https://github.com/paraspell/xcm-tools/commit/18d65d8dead2ef68c71e956a41ea0b1dcca3993b))

## [8.7.1](https://github.com/paraspell/xcm-tools/compare/sdk-core-v8.7.0...sdk-core-v8.7.1) (2025-03-13)


### Bug Fixes

* **sdk-core:** Fix Polkadot -&gt; Polimec transfer 🔧 ([2c508a4](https://github.com/paraspell/xcm-tools/commit/2c508a44ad6f92be2427d3fbcb84bcfbcfc6a448))
* **sdk-core:** Fix Polkadot -&gt; Polimec transfer 🔧 ([ef5ac26](https://github.com/paraspell/xcm-tools/commit/ef5ac263afdc6d6418ab495a9f09449ba994f014))

## [8.7.0](https://github.com/paraspell/xcm-tools/compare/sdk-core-v8.6.2...sdk-core-v8.7.0) (2025-03-12)


### Features

* **sdk-core:** Add support for PolkadotXCM execute transfers ✨ ([7387c96](https://github.com/paraspell/xcm-tools/commit/7387c96ab45dbc4e20cfa8254f808c5d621504b7))
* **sdk-core:** Add support for PolkadotXCM execute transfers ✨ ([3fee6ac](https://github.com/paraspell/xcm-tools/commit/3fee6ac6f45808758ebcbf1fedddbd3e825bcbd2))

## [8.6.2](https://github.com/paraspell/xcm-tools/compare/sdk-core-v8.6.1...sdk-core-v8.6.2) (2025-03-11)


### Bug Fixes

* **sdk-core:** Fix AH -&gt; system chains transfers 🔧 ([e65d436](https://github.com/paraspell/xcm-tools/commit/e65d436721c02cf4cb32b2444906d1cf00b2bb5d))
* **sdk-core:** Fix Polimec foreign assets fetching 🪙 ([00ebcc5](https://github.com/paraspell/xcm-tools/commit/00ebcc52edfaba51a848b38fffd3f1f37ab457c5))
* **sdk-core:** Fix Polimec foreign assets fetching 🪙 ([d5530bb](https://github.com/paraspell/xcm-tools/commit/d5530bb21278355c7c77eae15e4f5b68d2452baf))


### Code Refactoring

* **sdk-core:** Refactor override currency logic 🔧 ([6f4f636](https://github.com/paraspell/xcm-tools/commit/6f4f63685402907efb18b6346ce4c189773d219f))
* **sdk-core:** Refactor override currency logic 🔧 ([905e9c5](https://github.com/paraspell/xcm-tools/commit/905e9c5355fd7e0f1e8defbef34d4247e6b39f9d))

## [8.6.1](https://github.com/paraspell/xcm-tools/compare/sdk-core-v8.6.0...sdk-core-v8.6.1) (2025-03-10)


### Bug Fixes

* **sdk-core:** Remove Hydration non RPC compliant endpoint 🧹 ([c9af914](https://github.com/paraspell/xcm-tools/commit/c9af91438de7e01207d867172b8a56fb112f4397))
* **sdk-core:** Validate sender address in dry-run function 🛠️ ([f71efde](https://github.com/paraspell/xcm-tools/commit/f71efde6c1419bf15f5e9b8775d901483d410731))


### Code Refactoring

* Improve builder type safety 🔧 ([41389de](https://github.com/paraspell/xcm-tools/commit/41389dee44246fc83d46f45512f97433fd773b50))


### Tests

* **sdk-core:** Add assets E2E tests 🧪 ([e3dee4e](https://github.com/paraspell/xcm-tools/commit/e3dee4edd4d80cb4a806ed711862e5b9e3bb862e))


### Build System

* Add sort-imports ESlint rule ✨ ([d9bd402](https://github.com/paraspell/xcm-tools/commit/d9bd4024ba87f6c8fedad012100ea76fdf7658c8))

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
