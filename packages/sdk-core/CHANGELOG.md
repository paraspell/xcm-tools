# Changelog

## [11.14.6](https://github.com/paraspell/xcm-tools/compare/sdk-core-v11.14.5...sdk-core-v11.14.6) (2025-11-26)


### Miscellaneous Chores

* **sdk-core:** Synchronize main versions

## [11.14.5](https://github.com/paraspell/xcm-tools/compare/sdk-core-v11.14.4...sdk-core-v11.14.5) (2025-11-25)


### Code Refactoring

* **sdk-core:** Fully refactor balance logic 🧹 ([028d65d](https://github.com/paraspell/xcm-tools/commit/028d65d975e93a614e10ed5a8e853cf5eab9fd7b))


### Tests

* **sdk-core:** Add missing balance unit tests 🧪 ([027a3d4](https://github.com/paraspell/xcm-tools/commit/027a3d4d04b5caedfa16e2928461ed20845c1d43))

## [11.14.4](https://github.com/paraspell/xcm-tools/compare/sdk-core-v11.14.3...sdk-core-v11.14.4) (2025-11-21)


### Bug Fixes

* **sdk-core:** Add SDK level address validation 📕 ([57c6a2c](https://github.com/paraspell/xcm-tools/commit/57c6a2c9aaef9d0e152d6f4f1de1fe668237f9bc))
* **sdk-core:** Use TypeAndThen for BILL asset 🔧 ([ad07a47](https://github.com/paraspell/xcm-tools/commit/ad07a47dc59d9298ddc2c364db87c5efd42d078e))

## [11.14.3](https://github.com/paraspell/xcm-tools/compare/sdk-core-v11.14.2...sdk-core-v11.14.3) (2025-11-19)


### Bug Fixes

* **sdk-core:** Fix min transferable amount incorrect result 🛠️ ([#1469](https://github.com/paraspell/xcm-tools/issues/1469)) ([a964629](https://github.com/paraspell/xcm-tools/commit/a964629012989c0e18b3e590e6dc723e20681f97))

## [11.14.2](https://github.com/paraspell/xcm-tools/compare/sdk-core-v11.14.1...sdk-core-v11.14.2) (2025-11-14)


### Bug Fixes

* **sdk-core:** Fix override location logic for XTokens pallet 🔧 ([432ad6f](https://github.com/paraspell/xcm-tools/commit/432ad6fb64de87dd9acfa44256cb7c710962bcfa))


### Code Refactoring

* **sdk-core:** Refactor duplicate destChain resolution & refactor relayToPara overrides 🧹 ([239593a](https://github.com/paraspell/xcm-tools/commit/239593a913b428ce8810332e988d9a36d00eaf19))

## [11.14.1](https://github.com/paraspell/xcm-tools/compare/sdk-core-v11.14.0...sdk-core-v11.14.1) (2025-11-13)


### Bug Fixes

* **sdk-core:** Enable auto-reserve for RelayToPara scenarios ⚙️ ([501399a](https://github.com/paraspell/xcm-tools/commit/501399a83fa9d3dcb7cdddc0abccec899a733084))
* **sdk-core:** Update typeAndThen calls to use forwardedXcms for fee calculation ⚙️ ([5303a08](https://github.com/paraspell/xcm-tools/commit/5303a08d47863b03080f6b526548701d54a4d495))
* **sdk:** Fix e2e errors 🔧 ([4619da8](https://github.com/paraspell/xcm-tools/commit/4619da83cf5fdc7ea384b3d6b2decd1d8146f88c))

## [11.14.0](https://github.com/paraspell/xcm-tools/compare/sdk-core-v11.13.0...sdk-core-v11.14.0) (2025-11-12)


### Features

* **sdk:** Add support for more specific dry run errors ✨ ([0cdb43d](https://github.com/paraspell/xcm-tools/commit/0cdb43d5ee9516cc509136abeba6638a845c44e2))


### Bug Fixes

* Update Assets & Add e2e disabled chains filtering ✨ ([465bdac](https://github.com/paraspell/xcm-tools/commit/465bdaccaf2adff5531743786df98af01cefb359))
* **xcm-router:** Fix decimal slippage not working 🛠️ ([34361ae](https://github.com/paraspell/xcm-tools/commit/34361ae6d8d1183b4943592c8adb5f84732f7aa4))

## [11.13.0](https://github.com/paraspell/xcm-tools/compare/sdk-core-v11.12.15...sdk-core-v11.13.0) (2025-11-11)


### Features

* Remove Composable Finance chain 🧹 ([0475bbc](https://github.com/paraspell/xcm-tools/commit/0475bbc365050f36086526ffd006b038108aefc3))


### Bug Fixes

* **sdk-core:** Use localReserve when origin is relaychain 🔧 ([89365f3](https://github.com/paraspell/xcm-tools/commit/89365f38870e4d82065e76efb10c70a72074d22b))

## [11.12.15](https://github.com/paraspell/xcm-tools/compare/sdk-core-v11.12.14...sdk-core-v11.12.15) (2025-11-10)


### Bug Fixes

* **sdk-core:** Always use AH as reserve in system asset transfers ⚙️ ([eae3708](https://github.com/paraspell/xcm-tools/commit/eae37087cc5656e1052eecf7ee46939ee5cca1af))


### Code Refactoring

* **sdk-core:** Refactor polkadot xcm asset creation 🔧 ([77203d6](https://github.com/paraspell/xcm-tools/commit/77203d6783b5d73275e35473c4fc52d44a28b501))

## [11.12.14](https://github.com/paraspell/xcm-tools/compare/sdk-core-v11.12.13...sdk-core-v11.12.14) (2025-11-05)


### Bug Fixes

* **sdk-core:** Export validateDestination function ⬆️ ([97adbc9](https://github.com/paraspell/xcm-tools/commit/97adbc9a11067ad161a2a1f97dce90d71fb3c78b))

## [11.12.13](https://github.com/paraspell/xcm-tools/compare/sdk-core-v11.12.12...sdk-core-v11.12.13) (2025-11-04)


### Reverts

* **sdk-core:** Modify temporarily disabled scenarios 🔧 ([996f180](https://github.com/paraspell/xcm-tools/commit/996f1802be7a95c9f097d0213d00dc5443fc7868))
* **sdk-core:** Temporarily disable Polkadot system chains during migration ([5aff3d5](https://github.com/paraspell/xcm-tools/commit/5aff3d589c232f80e03a6807c5ae30c6a5c8255e))

## [11.12.12](https://github.com/paraspell/xcm-tools/compare/sdk-core-v11.12.11...sdk-core-v11.12.12) (2025-11-04)


### Bug Fixes

* **sdk-core:** Modify temporarily disabled scenarios 🔧 ([208aec5](https://github.com/paraspell/xcm-tools/commit/208aec52195097c1ada2e41ddd655511d03393b9))

## [11.12.11](https://github.com/paraspell/xcm-tools/compare/sdk-core-v11.12.10...sdk-core-v11.12.11) (2025-11-04)


### Bug Fixes

* Temporarily disable Polkadot system chains during migration ([c3175ad](https://github.com/paraspell/xcm-tools/commit/c3175adcd6718c3e15ffc0e8d729609b56c1b69f))

## [11.12.10](https://github.com/paraspell/xcm-tools/compare/sdk-core-v11.12.9...sdk-core-v11.12.10) (2025-11-03)


### Bug Fixes

* **sdk-core:** Fix NeuroWebPaseo minting & Update getXcmFee retry logic 🔧 ([fd0b0b8](https://github.com/paraspell/xcm-tools/commit/fd0b0b8437331568eeb35f6747f24d8f2187e3ce))

## [11.12.9](https://github.com/paraspell/xcm-tools/compare/sdk-core-v11.12.8...sdk-core-v11.12.9) (2025-10-31)


### Build System

* Perform a monthly maintenance check ⚙️ ([65d72b0](https://github.com/paraspell/xcm-tools/commit/65d72b032251ba023ff5340fce8d737bb884968a))

## [11.12.8](https://github.com/paraspell/xcm-tools/compare/sdk-core-v11.12.7...sdk-core-v11.12.8) (2025-10-31)


### Miscellaneous Chores

* **sdk-core:** Synchronize main versions

## [11.12.7](https://github.com/paraspell/xcm-tools/compare/sdk-core-v11.12.6...sdk-core-v11.12.7) (2025-10-30)


### Bug Fixes

* **sdk-core:** Fix Acala & Bifrost minting logic 🔧 ([0189bfa](https://github.com/paraspell/xcm-tools/commit/0189bfaa9c3b2c8447755e2b8220803f98338012))
* **sdk-core:** Fix amount normalization ⚙️ ([433be1e](https://github.com/paraspell/xcm-tools/commit/433be1e04a324fcde959898039d4c1ee9158cf82))

## [11.12.6](https://github.com/paraspell/xcm-tools/compare/sdk-core-v11.12.5...sdk-core-v11.12.6) (2025-10-30)


### Bug Fixes

* **sdk-core:** Add xcm fee auto amount decrease ✨ ([1dd0b35](https://github.com/paraspell/xcm-tools/commit/1dd0b352e1a53afe858c245b223981e42bfcb8a1))
* **sdk-core:** Apply conditional fees for specific type then scenarios 🛠️ ([c6e62cb](https://github.com/paraspell/xcm-tools/commit/c6e62cb5fc0a48c459fa85f065a5b113295d2250))
* **sdk-core:** Fix incorrect feeAsset when relay asset is not attached 🔧 ([aefc3eb](https://github.com/paraspell/xcm-tools/commit/aefc3eb19869370bdd4a92819047ad59fc5fa789))
* **sdk-core:** Temporarily disable Manta cross-chain transfers 📴 ([09018b5](https://github.com/paraspell/xcm-tools/commit/09018b53128a4b02e5380635bd31646c9f54ab95))

## [11.12.5](https://github.com/paraspell/xcm-tools/compare/sdk-core-v11.12.4...sdk-core-v11.12.5) (2025-10-28)


### Bug Fixes

* **sdk-core:** Prevent 0 amount in type then buy execution 🔧 ([7366f35](https://github.com/paraspell/xcm-tools/commit/7366f357398b3687ea5cf13911fd5461940e2952))

## [11.12.4](https://github.com/paraspell/xcm-tools/compare/sdk-core-v11.12.3...sdk-core-v11.12.4) (2025-10-28)


### Bug Fixes

* **assets:** Fix asset search between ecosystems 🛠️ ([49ba9d5](https://github.com/paraspell/xcm-tools/commit/49ba9d59282c7c3152d574b28b847a7098961682))

## [11.12.3](https://github.com/paraspell/xcm-tools/compare/sdk-core-v11.12.2...sdk-core-v11.12.3) (2025-10-27)


### Bug Fixes

* **sdk-core:** Migrate substrate bridge to type and then ➡️ ([9c5b7cd](https://github.com/paraspell/xcm-tools/commit/9c5b7cd4c42eb50f33391ec6c03a1fbd5e715cdd))


### Code Refactoring

* **sdk-core:** Extract fee asset resolution logic to common func 🧹 ([135f4f6](https://github.com/paraspell/xcm-tools/commit/135f4f671cc5ac61bed7bcb3315884a06fa905c4))

## [11.12.2](https://github.com/paraspell/xcm-tools/compare/sdk-core-v11.12.1...sdk-core-v11.12.2) (2025-10-22)


### Bug Fixes

* **sdk-core:** Use correct error class in execute call 🔧 ([5826d99](https://github.com/paraspell/xcm-tools/commit/5826d991e6a64ada049b3efd0c621cbe8c8f77b5))

## [11.12.1](https://github.com/paraspell/xcm-tools/compare/sdk-core-v11.12.0...sdk-core-v11.12.1) (2025-10-21)


### Miscellaneous Chores

* **sdk-core:** Synchronize main versions

## [11.12.0](https://github.com/paraspell/xcm-tools/compare/sdk-core-v11.11.0...sdk-core-v11.12.0) (2025-10-21)


### Features

* **xcm-router:** Add dryRun function to RouterBuilder 🪄 ([1f14dc9](https://github.com/paraspell/xcm-tools/commit/1f14dc94cb40edce7ade9faf157ddcf6cdbd5925))


### Code Refactoring

* **xcm-router:** Use native bigint instead of bignumber.js 📦 ([e0d227e](https://github.com/paraspell/xcm-tools/commit/e0d227e3ad0d59578fccf494bd0598c6e2d39b51))

## [11.11.0](https://github.com/paraspell/xcm-tools/compare/sdk-core-v11.10.0...sdk-core-v11.11.0) (2025-10-14)


### Features

* **sdk-core:** Add getReceivableAmount func to builder 🧱 ([6691a0d](https://github.com/paraspell/xcm-tools/commit/6691a0d294b9df3c4a05e8557ea45d36ff46c0a6))

## [11.10.0](https://github.com/paraspell/xcm-tools/compare/sdk-core-v11.9.3...sdk-core-v11.10.0) (2025-10-13)


### Features

* **xcm-router:** Add support for apiOverrides ✨ ([12ac6b8](https://github.com/paraspell/xcm-tools/commit/12ac6b8cdea3479fc486535036bb68253eb09238))

## [11.9.3](https://github.com/paraspell/xcm-tools/compare/sdk-core-v11.9.2...sdk-core-v11.9.3) (2025-10-10)


### Miscellaneous Chores

* **sdk-core:** Synchronize main versions

## [11.9.2](https://github.com/paraspell/xcm-tools/compare/sdk-core-v11.9.1...sdk-core-v11.9.2) (2025-10-10)


### Bug Fixes

* **sdk:** Add PAPI support for legacy chains 🔧 ([5388409](https://github.com/paraspell/xcm-tools/commit/538840978eb132b36ba78e93c19927d553781d11))

## [11.9.1](https://github.com/paraspell/xcm-tools/compare/sdk-core-v11.9.0...sdk-core-v11.9.1) (2025-10-09)


### Bug Fixes

* **sdk-core:** Add amount all handling for fee functions ✨ ([ceead0e](https://github.com/paraspell/xcm-tools/commit/ceead0ef919080f18123f6289e1d3b2a7f33663c))

## [11.9.0](https://github.com/paraspell/xcm-tools/compare/sdk-core-v11.8.6...sdk-core-v11.9.0) (2025-10-08)


### Features

* **sdk-core:** Add support for ALL amount for local transfers ✨ ([4d06874](https://github.com/paraspell/xcm-tools/commit/4d06874e7365cb55e9522e7b42433118992d7551))

## [11.8.6](https://github.com/paraspell/xcm-tools/compare/sdk-core-v11.8.5...sdk-core-v11.8.6) (2025-10-06)


### Bug Fixes

* Fix type then teleport to system chains 🔧 ([f0d9cf1](https://github.com/paraspell/xcm-tools/commit/f0d9cf1f574451ea706330b1a59438a319ae9839))
* Perform a monthly check ⚙️ ([e5fba54](https://github.com/paraspell/xcm-tools/commit/e5fba54c4b724b716c20f26ae92e7a0f8d9b0524))
* **sdk-core:** Add relay asset reserve auto-select ✨ ([a7fb4b4](https://github.com/paraspell/xcm-tools/commit/a7fb4b4bd6c18448a70a9fef75e951870c30ae51))


### Tests

* **sdk:** Add dry run bypass E2E tests 🧪 ([36fe5a9](https://github.com/paraspell/xcm-tools/commit/36fe5a9203542334525b34d22d0c8a698ff8cdf3))

## [11.8.5](https://github.com/paraspell/xcm-tools/compare/sdk-core-v11.8.4...sdk-core-v11.8.5) (2025-09-26)


### Bug Fixes

* **sdk-core:** Display fee in MYTH on AH hop when Mythos -&gt; Ethereum 🔧 ([8042f13](https://github.com/paraspell/xcm-tools/commit/8042f1346a0a0506a354ea0e5630fae26d8cca3a))

## [11.8.4](https://github.com/paraspell/xcm-tools/compare/sdk-core-v11.8.3...sdk-core-v11.8.4) (2025-09-24)


### Bug Fixes

* **sdk-core:** Fix BridgeHub fees 💰 ([e9c4d87](https://github.com/paraspell/xcm-tools/commit/e9c4d87b750b5c1ce506e49ef78d35c09a29ad35))

## [11.8.3](https://github.com/paraspell/xcm-tools/compare/sdk-core-v11.8.2...sdk-core-v11.8.3) (2025-09-24)


### Bug Fixes

* **sdk-core:** Fix sufficient param calculations ⚙️ ([81327c5](https://github.com/paraspell/xcm-tools/commit/81327c50765dd71574af00dc66159a210b1cf6d4))

## [11.8.2](https://github.com/paraspell/xcm-tools/compare/sdk-core-v11.8.1...sdk-core-v11.8.2) (2025-09-22)


### Bug Fixes

* Add delivery fees fetching ⚙️ ([e8a2193](https://github.com/paraspell/xcm-tools/commit/e8a2193734c998e8f9535da39b0ecb872d5a3d56))
* Fix reverse tx creation 🔧 ([778e210](https://github.com/paraspell/xcm-tools/commit/778e2102b46ffdcff62a0f45aba8b94414d8e101))

## [11.8.1](https://github.com/paraspell/xcm-tools/compare/sdk-core-v11.8.0...sdk-core-v11.8.1) (2025-09-19)


### Bug Fixes

* Add dynamic bypass amount calculations ⚙️ ([21369d1](https://github.com/paraspell/xcm-tools/commit/21369d19870140327f08f74c83dc41dde6c0d23d))

## [11.8.0](https://github.com/paraspell/xcm-tools/compare/sdk-core-v11.7.2...sdk-core-v11.8.0) (2025-09-19)


### Features

* Add Xode parachain 🪄 ([d051bef](https://github.com/paraspell/xcm-tools/commit/d051bef2eee54dcd4d7d40a7a5395cba0d068068))


### Bug Fixes

* Override XCM Payment API on System chains ([aedb287](https://github.com/paraspell/xcm-tools/commit/aedb2874c72538e6ac41b07d48a8c96cea19a540))
* **xcm-router:** Fix router getXcmFee edge case ⚙️ ([3c52c66](https://github.com/paraspell/xcm-tools/commit/3c52c66840226c367e6ef374c288040a2c08839a))

## [11.7.2](https://github.com/paraspell/xcm-tools/compare/sdk-core-v11.7.1...sdk-core-v11.7.2) (2025-09-17)


### Bug Fixes

* **sdk-core:** Fix router fee bypass ⚙️ ([955f450](https://github.com/paraspell/xcm-tools/commit/955f450bfc49257edf26a289a5c94fbed654da5c))

## [11.7.1](https://github.com/paraspell/xcm-tools/compare/sdk-core-v11.7.0...sdk-core-v11.7.1) (2025-09-17)


### Bug Fixes

* **sdk-core:** Fix txs creation for bypass 🔧 ([bcfefc7](https://github.com/paraspell/xcm-tools/commit/bcfefc7764c2d25f5d4e51919591eb247d0dd0e2))

## [11.7.0](https://github.com/paraspell/xcm-tools/compare/sdk-core-v11.6.1...sdk-core-v11.7.0) (2025-09-16)


### Features

* Add xcm format check using dry-run 👨‍💻 ([0c80198](https://github.com/paraspell/xcm-tools/commit/0c801985aa489f7c233144a39385dc5d0a6f7e70))

## [11.6.1](https://github.com/paraspell/xcm-tools/compare/sdk-core-v11.6.0...sdk-core-v11.6.1) (2025-09-16)


### Bug Fixes

* Fix compile errors 🛠️ ([3144f89](https://github.com/paraspell/xcm-tools/commit/3144f8926fb9d6d524275f97c69799e6992b1865))
* **sdk-core:** Override bypass amount to fixed value 🔧 ([ae674fd](https://github.com/paraspell/xcm-tools/commit/ae674fd2d686a6f4156ae9da9feeaff83ab3baa3))

## [11.6.0](https://github.com/paraspell/xcm-tools/compare/sdk-core-v11.5.1...sdk-core-v11.6.0) (2025-09-15)


### Features

* Add IntegriteePolkadot parachain 🪄 ([843d4d6](https://github.com/paraspell/xcm-tools/commit/843d4d68f21e9aaf52a95a8040085f1d75023358))

## [11.5.1](https://github.com/paraspell/xcm-tools/compare/sdk-core-v11.5.0...sdk-core-v11.5.1) (2025-09-12)


### Bug Fixes

* Use XcmPaymentApi for AH if not execute & Fix transfer info calculations 🛠️ ([70e7434](https://github.com/paraspell/xcm-tools/commit/70e7434ef4a004522e563bca7db63c8e0ee8a7a4))

## [11.5.0](https://github.com/paraspell/xcm-tools/compare/sdk-core-v11.4.2...sdk-core-v11.5.0) (2025-09-12)


### Features

* **sdk-core:** Add min transferable amount function 🪄 ([5bf88e1](https://github.com/paraspell/xcm-tools/commit/5bf88e146bd63ef8fc6610efbbffed6fd74fac00))

## [11.4.2](https://github.com/paraspell/xcm-tools/compare/sdk-core-v11.4.1...sdk-core-v11.4.2) (2025-09-11)


### Bug Fixes

* Fix Ethereum native asset search for fee queries 🔧 ([c71e004](https://github.com/paraspell/xcm-tools/commit/c71e004ff77c4b036cd75a7914709a819be20134))

## [11.4.1](https://github.com/paraspell/xcm-tools/compare/sdk-core-v11.4.0...sdk-core-v11.4.1) (2025-09-10)


### Miscellaneous Chores

* **sdk-core:** Synchronize main versions

## [11.4.0](https://github.com/paraspell/xcm-tools/compare/sdk-core-v11.3.2...sdk-core-v11.4.0) (2025-09-10)


### Features

* Add dry run preview 🪄 ([101f25d](https://github.com/paraspell/xcm-tools/commit/101f25da6a4f4fcce9435a948ddeae7b0631cdc5))

## [11.3.2](https://github.com/paraspell/xcm-tools/compare/sdk-core-v11.3.1...sdk-core-v11.3.2) (2025-09-08)


### Bug Fixes

* **sdk-core:** Temporarily disable Ajuna transfers 🔧 ([031912e](https://github.com/paraspell/xcm-tools/commit/031912e53025697712b6fc1dbee3aeb65b558431))

## [11.3.1](https://github.com/paraspell/xcm-tools/compare/sdk-core-v11.3.0...sdk-core-v11.3.1) (2025-09-06)


### Bug Fixes

* **sdk-core:** Fix use type and then condition 🔧 ([6b2fd37](https://github.com/paraspell/xcm-tools/commit/6b2fd375f250f433bf69e11827f52accd1cc3d93))

## [11.3.0](https://github.com/paraspell/xcm-tools/compare/sdk-core-v11.2.4...sdk-core-v11.3.0) (2025-09-06)


### Features

* Add full asset info to fee queries 🪄 ([0c56240](https://github.com/paraspell/xcm-tools/commit/0c562408361e1e3d4301799b4a5a140893385451))
* Switch system asset transfers to type and then 🛠️ ([f2c3dd5](https://github.com/paraspell/xcm-tools/commit/f2c3dd54d8e90b8f27415f0b8c8f6f3650218678))

## [11.2.4](https://github.com/paraspell/xcm-tools/compare/sdk-core-v11.2.3...sdk-core-v11.2.4) (2025-09-02)


### Bug Fixes

* Refactor location localization & fix bifrost dex issues 🔧 ([0d83ded](https://github.com/paraspell/xcm-tools/commit/0d83ded64dae482ac84986475dd76e4a8f714e82))

## [11.2.3](https://github.com/paraspell/xcm-tools/compare/sdk-core-v11.2.2...sdk-core-v11.2.3) (2025-08-31)


### Bug Fixes

* Perform monthly maintenance check ([8854677](https://github.com/paraspell/xcm-tools/commit/88546775fbb5ab4b95ec1a1dde9f0c92d99a5bb5))

## [11.2.2](https://github.com/paraspell/xcm-tools/compare/sdk-core-v11.2.1...sdk-core-v11.2.2) (2025-08-29)


### Bug Fixes

* Re-enable system chains ([833e82b](https://github.com/paraspell/xcm-tools/commit/833e82b7d8108b1aab3817dc05863ec3949ac378))

## [11.2.1](https://github.com/paraspell/xcm-tools/compare/sdk-core-v11.2.0...sdk-core-v11.2.1) (2025-08-29)


### Code Refactoring

* Use dryRun bypass in every func ✨ ([5997993](https://github.com/paraspell/xcm-tools/commit/59979932ced5a3d91ee3873d2b470597eb87e7e8))

## [11.2.0](https://github.com/paraspell/xcm-tools/compare/sdk-core-v11.1.1...sdk-core-v11.2.0) (2025-08-29)


### Features

* **sdk-core:** Use dryRun root bypass to always show fees 🪄 ([76fee70](https://github.com/paraspell/xcm-tools/commit/76fee703be840203a97eac07d747221c273257ab))

## [11.1.1](https://github.com/paraspell/xcm-tools/compare/sdk-core-v11.1.0...sdk-core-v11.1.1) (2025-08-22)


### Bug Fixes

* Re-enable mythos ([4d6027e](https://github.com/paraspell/xcm-tools/commit/4d6027e883745e451287b38d9487a2115602a66d))

## [11.1.0](https://github.com/paraspell/xcm-tools/compare/sdk-core-v11.0.1...sdk-core-v11.1.0) (2025-08-21)


### Features

* **pallets:** Add assets pallet info to pallets.json 🪄 ([66279f1](https://github.com/paraspell/xcm-tools/commit/66279f17765fccfc72b36d4ffd28b4789de88343))

## [11.0.1](https://github.com/paraspell/xcm-tools/compare/sdk-core-v11.0.0...sdk-core-v11.0.1) (2025-08-18)


### Miscellaneous Chores

* **sdk-core:** Synchronize main versions

## [11.0.0](https://github.com/paraspell/xcm-tools/compare/sdk-core-v10.11.10...sdk-core-v11.0.0) (2025-08-16)


### ⚠ BREAKING CHANGES

* Rename `node` to `chain` 👨‍💻
* Remove multi prefix 🪄

### Features

* Add decimal abstraction feature ✨ ([604ab79](https://github.com/paraspell/xcm-tools/commit/604ab795c219f29b2276e5f0e7b644c26f4a281c))
* Remove multi prefix 🪄 ([2577fd8](https://github.com/paraspell/xcm-tools/commit/2577fd868dca2a06cca452357dc84385910b9c19))
* Rename `node` to `chain` 👨‍💻 ([ec1a66f](https://github.com/paraspell/xcm-tools/commit/ec1a66fc7d6ee3a68f2072516c2fbfd176dbaa14))


### Bug Fixes

* **assets:** Migrate to new Snowbridge asset registry 🪄 ([d36c1b7](https://github.com/paraspell/xcm-tools/commit/d36c1b753836f6cee00b45119e6644c135d442f9))

## [10.11.10](https://github.com/paraspell/xcm-tools/compare/sdk-core-v10.11.9...sdk-core-v10.11.10) (2025-08-14)


### Miscellaneous Chores

* **sdk-core:** Synchronize main versions

## [10.11.9](https://github.com/paraspell/xcm-tools/compare/sdk-core-v10.11.8...sdk-core-v10.11.9) (2025-08-13)


### Bug Fixes

* Add missing Moonbeam wh assets 🔧 ([25d5cbc](https://github.com/paraspell/xcm-tools/commit/25d5cbc6a4e3a99f6e30c73c777ef59e560f0139))

## [10.11.8](https://github.com/paraspell/xcm-tools/compare/sdk-core-v10.11.7...sdk-core-v10.11.8) (2025-08-11)


### Miscellaneous Chores

* **sdk-core:** Synchronize main versions

## [10.11.7](https://github.com/paraspell/xcm-tools/compare/sdk-core-v10.11.6...sdk-core-v10.11.7) (2025-08-08)


### Code Refactoring

* **sdk-core:** Refactor transferEthAssetViaAh to use shared typeAndThen function 🧹 ([2225b1f](https://github.com/paraspell/xcm-tools/commit/2225b1fae9c64431e14d04d3971f3680b5a12642))

## [10.11.6](https://github.com/paraspell/xcm-tools/compare/sdk-core-v10.11.5...sdk-core-v10.11.6) (2025-08-06)


### Miscellaneous Chores

* **sdk-core:** Synchronize main versions

## [10.11.5](https://github.com/paraspell/xcm-tools/compare/sdk-core-v10.11.4...sdk-core-v10.11.5) (2025-08-05)


### Miscellaneous Chores

* **sdk-core:** Synchronize main versions

## [10.11.4](https://github.com/paraspell/xcm-tools/compare/sdk-core-v10.11.3...sdk-core-v10.11.4) (2025-08-04)


### Miscellaneous Chores

* **sdk-core:** Synchronize main versions

## [10.11.3](https://github.com/paraspell/xcm-tools/compare/sdk-core-v10.11.2...sdk-core-v10.11.3) (2025-08-03)


### Bug Fixes

* **sdk-core:** Patch transfer_assets to type_and_then 🔧 ([c6718fb](https://github.com/paraspell/xcm-tools/commit/c6718fbf8c963103205ec112b63f5805384b72db))

## [10.11.2](https://github.com/paraspell/xcm-tools/compare/sdk-core-v10.11.1...sdk-core-v10.11.2) (2025-08-01)


### Miscellaneous Chores

* **sdk-core:** Synchronize main versions

## [10.11.1](https://github.com/paraspell/xcm-tools/compare/sdk-core-v10.11.0...sdk-core-v10.11.1) (2025-08-01)


### Miscellaneous Chores

* **sdk-core:** Synchronize main versions

## [10.11.0](https://github.com/paraspell/xcm-tools/compare/sdk-core-v10.10.11...sdk-core-v10.11.0) (2025-07-31)


### Features

* Enhance localhost UX 🪄 ([cb411b4](https://github.com/paraspell/xcm-tools/commit/cb411b4beef70fd55ce1fe55bad5d6dc9bdbc1a8))
* **sdk-core:** Update chains to XCM v5 🪄 ([738de6d](https://github.com/paraspell/xcm-tools/commit/738de6d32f4d636017ca26e32d8a0009c3ad2c0d))


### Bug Fixes

* **assets:** Remove XCM GAR from assets scripts 🔧 ([5a47369](https://github.com/paraspell/xcm-tools/commit/5a47369cca1d142955cd4bb5412d4d601be0725f))


### Documentation

* Add bug bounty into docs🪲 ([085ad79](https://github.com/paraspell/xcm-tools/commit/085ad799f18edb6c088bfe4271cde3c8d9d87a16))


### Tests

* **sdk:** Add snapshot tests 🧪 ([6e34e92](https://github.com/paraspell/xcm-tools/commit/6e34e920e190e5ae447c964ac905ee546f83b9f9))


### Build System

* Perform a monthly maintenance check 🧹 ([6a5d4ab](https://github.com/paraspell/xcm-tools/commit/6a5d4ab8838d70ed81582fb3e7abcc54a400ae77))

## [10.10.11](https://github.com/paraspell/xcm-tools/compare/sdk-core-v10.10.10...sdk-core-v10.10.11) (2025-07-22)


### Code Refactoring

* **sdk-core:** Change internal TMultiAsset fungible type to bigint 🪄 ([ba9ec6c](https://github.com/paraspell/xcm-tools/commit/ba9ec6cde9e573daf4a151251be686a570e47f66))

## [10.10.10](https://github.com/paraspell/xcm-tools/compare/sdk-core-v10.10.9...sdk-core-v10.10.10) (2025-07-22)


### Bug Fixes

* **sdk-core:** Fix incorrect DOT fees 🛠️ ([8bc61f9](https://github.com/paraspell/xcm-tools/commit/8bc61f9660269af414943c2011b2ca16fa7f0029))
* **sdk-core:** Tweak getTransferableAmount & add supported-assets to playground ✨ ([d1764f4](https://github.com/paraspell/xcm-tools/commit/d1764f4018777b7bb941f654ce86689fbfef99f5))


### Documentation

* Add contact options ([0709bb2](https://github.com/paraspell/xcm-tools/commit/0709bb26210a3c97b913e7518eba01f400a10cd8))

## [10.10.9](https://github.com/paraspell/xcm-tools/compare/sdk-core-v10.10.8...sdk-core-v10.10.9) (2025-07-17)


### Bug Fixes

* **sdk-core:** Update getTransferablAmount logic 🛠️ ([7be1c71](https://github.com/paraspell/xcm-tools/commit/7be1c71b54e2986a726c9281181106a8df73b9e2))

## [10.10.8](https://github.com/paraspell/xcm-tools/compare/sdk-core-v10.10.7...sdk-core-v10.10.8) (2025-07-16)


### Miscellaneous Chores

* **sdk-core:** Synchronize main versions

## [10.10.7](https://github.com/paraspell/xcm-tools/compare/sdk-core-v10.10.6...sdk-core-v10.10.7) (2025-07-14)


### Bug Fixes

* **sdk-core:** Fix execute swap transfer amountOut 🔧 ([2db8414](https://github.com/paraspell/xcm-tools/commit/2db8414f5de18a7a04ef9ac679fc8caad9d6ce6c))

## [10.10.6](https://github.com/paraspell/xcm-tools/compare/sdk-core-v10.10.5...sdk-core-v10.10.6) (2025-07-12)


### Bug Fixes

* Fix execute swaps for origins without XcmPaymentApi 🔧 ([70b9726](https://github.com/paraspell/xcm-tools/commit/70b97266f1e41623a89c621f5bafdb7f6d69f494))

## [10.10.5](https://github.com/paraspell/xcm-tools/compare/sdk-core-v10.10.4...sdk-core-v10.10.5) (2025-07-11)


### Code Refactoring

* **sdk-core:** Refactor getXcmFee, dryRun functions & improve type safety 🪄 ([b09a6d1](https://github.com/paraspell/xcm-tools/commit/b09a6d1bde3dac8b14ac7360f4e02e38ab7d5ebe))


### Continuous Integration

* Add assets update Github action ✨ ([be9952a](https://github.com/paraspell/xcm-tools/commit/be9952a394840c883ad4faba487f2545bcf25756))

## [10.10.4](https://github.com/paraspell/xcm-tools/compare/sdk-core-v10.10.3...sdk-core-v10.10.4) (2025-07-10)


### Miscellaneous Chores

* **sdk-core:** Synchronize main versions

## [10.10.3](https://github.com/paraspell/xcm-tools/compare/sdk-core-v10.10.2...sdk-core-v10.10.3) (2025-07-08)


### Miscellaneous Chores

* **sdk-core:** Synchronize main versions

## [10.10.2](https://github.com/paraspell/xcm-tools/compare/sdk-core-v10.10.1...sdk-core-v10.10.2) (2025-07-08)


### Bug Fixes

* **xcm-router:** Fix fee query currencies 🔧 ([a09ccf8](https://github.com/paraspell/xcm-tools/commit/a09ccf809fe0079b107dfc27c032a1e0eadffc87))

## [10.10.1](https://github.com/paraspell/xcm-tools/compare/sdk-core-v10.10.0...sdk-core-v10.10.1) (2025-07-04)


### Bug Fixes

* Fix execute transfer edge cases 🔧 ([56921e0](https://github.com/paraspell/xcm-tools/commit/56921e06267262c108f937da3320f6fb4e6d2fa3))

## [10.10.0](https://github.com/paraspell/xcm-tools/compare/sdk-core-v10.9.0...sdk-core-v10.10.0) (2025-07-04)


### Features

* Add testnets support 🧪 ✨ ([6a9f19e](https://github.com/paraspell/xcm-tools/commit/6a9f19ed05e937d097f9e3846016f6e773e27a7e))

## [10.9.0](https://github.com/paraspell/xcm-tools/compare/sdk-core-v10.8.3...sdk-core-v10.9.0) (2025-07-03)


### Features

* **sdk-core:** Add Jamton parachain 🕺✨ ([e7bd8e6](https://github.com/paraspell/xcm-tools/commit/e7bd8e69f5798e4e363a1a95b4be80fa9c8c6124))
* **xcm-router:** Add support for 1-click transfer -&gt; swaps 🪄✨ ([32925d0](https://github.com/paraspell/xcm-tools/commit/32925d04d4833ec6deb67491b1855b89a6d8f9be))


### Bug Fixes

* **sdk-core:** Fix Mythos transfer & AH fee events 🛠️ ([cd4beb9](https://github.com/paraspell/xcm-tools/commit/cd4beb9da60f4dc5fcbc69e9eda3f29e1bcf2ba1))

## [10.8.3](https://github.com/paraspell/xcm-tools/compare/sdk-core-v10.8.2...sdk-core-v10.8.3) (2025-07-01)


### Bug Fixes

* **sdk:** Default to native asset on origin when using XcmPaymentApi 🔧 ([a16d161](https://github.com/paraspell/xcm-tools/commit/a16d161ec2627c6c7f81d5dd3daa45aaab515691))

## [10.8.2](https://github.com/paraspell/xcm-tools/compare/sdk-core-v10.8.1...sdk-core-v10.8.2) (2025-06-30)


### Build System

* Perform a monthly maintenance check ✨ ([9ac0349](https://github.com/paraspell/xcm-tools/commit/9ac0349d2a8e02f850588a434ffaf8d7065da128))

## [10.8.1](https://github.com/paraspell/xcm-tools/compare/sdk-core-v10.8.0...sdk-core-v10.8.1) (2025-06-28)


### Miscellaneous Chores

* **sdk-core:** Synchronize main versions

## [10.8.0](https://github.com/paraspell/xcm-tools/compare/sdk-core-v10.7.2...sdk-core-v10.8.0) (2025-06-20)


### Features

* **sdk-core:** Add hops property & fix execute teleport ✨ ([38e12ff](https://github.com/paraspell/xcm-tools/commit/38e12fff8b27f90a15473ee09c25024ab4f3a21b))

## [10.7.2](https://github.com/paraspell/xcm-tools/compare/sdk-core-v10.7.1...sdk-core-v10.7.2) (2025-06-20)


### Bug Fixes

* **sdk-core:** Remove Mythos balance check 🔧 ([ce91edc](https://github.com/paraspell/xcm-tools/commit/ce91edc42b8381d4bb2ce8d4f02165ae987cd7c8))

## [10.7.1](https://github.com/paraspell/xcm-tools/compare/sdk-core-v10.7.0...sdk-core-v10.7.1) (2025-06-19)


### Miscellaneous Chores

* **sdk-core:** Synchronize main versions

## [10.7.0](https://github.com/paraspell/xcm-tools/compare/sdk-core-v10.6.0...sdk-core-v10.7.0) (2025-06-19)


### Features

* **sdk-core:** Add execute transfers for Hydration ✨ ([d1e741a](https://github.com/paraspell/xcm-tools/commit/d1e741a8f77691c26c678d6f2178e31faf38202b))

## [10.6.0](https://github.com/paraspell/xcm-tools/compare/sdk-core-v10.5.2...sdk-core-v10.6.0) (2025-06-18)


### Features

* **sdk-core:** Enable Mythos -&gt; Ethereum transfers 🪄 ([dc9dc6b](https://github.com/paraspell/xcm-tools/commit/dc9dc6bdda4c4a4ac16401b647bbb53da7c1cbe5))

## [10.5.2](https://github.com/paraspell/xcm-tools/compare/sdk-core-v10.5.1...sdk-core-v10.5.2) (2025-06-13)


### Bug Fixes

* **sdk-core:** Fix sufficient field calculations 🔧 ([b217f3a](https://github.com/paraspell/xcm-tools/commit/b217f3acbaf2dc0ce79faa47e44ace0a424f0c9d))
* **xcm-router:** Fix getSwapFee function 🔧 ([4a45aec](https://github.com/paraspell/xcm-tools/commit/4a45aec4b3fdd76ed94a25fedb975d1067747c64))

## [10.5.1](https://github.com/paraspell/xcm-tools/compare/sdk-core-v10.5.0...sdk-core-v10.5.1) (2025-06-13)


### Bug Fixes

* **sdk:** Prefer to use XcmPaymentApi for fee calculation ✨ ([8421510](https://github.com/paraspell/xcm-tools/commit/84215108db522624d70aabc1c88036808f971b05))

## [10.5.0](https://github.com/paraspell/xcm-tools/compare/sdk-core-v10.4.10...sdk-core-v10.5.0) (2025-06-12)


### Features

* **assets:** Add supported destinations query 🪄 ([dfebfee](https://github.com/paraspell/xcm-tools/commit/dfebfeea6683ce54bed489ebbf669916170cbb12))

## [10.4.10](https://github.com/paraspell/xcm-tools/compare/sdk-core-v10.4.9...sdk-core-v10.4.10) (2025-06-12)


### Bug Fixes

* Repair magic numbers✨ ([5913843](https://github.com/paraspell/xcm-tools/commit/591384374540b0bd08e23a4a5caa44c16f515016))

## [10.4.9](https://github.com/paraspell/xcm-tools/compare/sdk-core-v10.4.8...sdk-core-v10.4.9) (2025-06-11)


### Code Refactoring

* **sdk-core:** Refactor PolkadotXcm pallet implementation 👨‍💻 ([e291c96](https://github.com/paraspell/xcm-tools/commit/e291c9606b44db191eddfb874338cd8ca4727cb1))

## [10.4.8](https://github.com/paraspell/xcm-tools/compare/sdk-core-v10.4.7...sdk-core-v10.4.8) (2025-06-10)


### Bug Fixes

* Fix BigInt serialization in errors 🔧 ([a2d0d86](https://github.com/paraspell/xcm-tools/commit/a2d0d860cfb3b633648b00c4147b45c87a769109))

## [10.4.7](https://github.com/paraspell/xcm-tools/compare/sdk-core-v10.4.6...sdk-core-v10.4.7) (2025-06-10)


### Bug Fixes

* **sdk-core:** Add sufficient true when dry run passes 🔧 ([de33ce4](https://github.com/paraspell/xcm-tools/commit/de33ce46e8360f2bdc04f5cab494aa106cdeb826))

## [10.4.6](https://github.com/paraspell/xcm-tools/compare/sdk-core-v10.4.5...sdk-core-v10.4.6) (2025-06-10)


### Bug Fixes

* **sdk-core:** Add check for sender address 🔧 ([f572ad2](https://github.com/paraspell/xcm-tools/commit/f572ad2ea02090278bfa7658d77d582c965a4311))

## [10.4.5](https://github.com/paraspell/xcm-tools/compare/sdk-core-v10.4.4...sdk-core-v10.4.5) (2025-06-10)


### Miscellaneous Chores

* **sdk-core:** Synchronize main versions

## [10.4.4](https://github.com/paraspell/xcm-tools/compare/sdk-core-v10.4.3...sdk-core-v10.4.4) (2025-06-09)


### Bug Fixes

* Improve XCM version handling & Update calls to V4 🔧 ([7e5e356](https://github.com/paraspell/xcm-tools/commit/7e5e3565b0e94a7f88fa48f0209f786276bed829))

## [10.4.3](https://github.com/paraspell/xcm-tools/compare/sdk-core-v10.4.2...sdk-core-v10.4.3) (2025-06-06)


### Bug Fixes

* **sdk-core:** Allow different fee assets for execute call ✨ ([763685d](https://github.com/paraspell/xcm-tools/commit/763685de9d205d1654249903db06e0c2ed31ad07))

## [10.4.2](https://github.com/paraspell/xcm-tools/compare/sdk-core-v10.4.1...sdk-core-v10.4.2) (2025-06-05)


### Bug Fixes

* Moonbeam dest fee & AH bridged KSM transfer 🛠️ ([e126c9f](https://github.com/paraspell/xcm-tools/commit/e126c9f32b56fe6784aa65c643100a1c538e51bf))

## [10.4.1](https://github.com/paraspell/xcm-tools/compare/sdk-core-v10.4.0...sdk-core-v10.4.1) (2025-06-05)


### Bug Fixes

* **sdk-core:** Fix bridged KSM transfers 🛠️ ([a395859](https://github.com/paraspell/xcm-tools/commit/a3958590b7dc566a0f65797c08b815a77f7b88a5))

## [10.4.0](https://github.com/paraspell/xcm-tools/compare/sdk-core-v10.3.1...sdk-core-v10.4.0) (2025-06-04)


### Features

* **sdk-core:** Add para -&gt; AH autoswap transfer ✨ ([fdf6ec6](https://github.com/paraspell/xcm-tools/commit/fdf6ec6517c948510d279b1b0638eea15025a5d1))
* **sdk-core:** Add sufficient field to xcm fee queries ✨ ([ded8648](https://github.com/paraspell/xcm-tools/commit/ded8648321f254f05bbf761129b01926c7b3b2ed))
* **sdk-core:** Add top-level failureReason & failureChain 👨‍💻 ([c94fc8a](https://github.com/paraspell/xcm-tools/commit/c94fc8a0eee3ae8975fbce5c5834af5533a9a43c))


### Bug Fixes

* **sdk-core:** Add fallback for zero or negative amount 🔧 ([881a0a7](https://github.com/paraspell/xcm-tools/commit/881a0a759b2b817ccfe021fa2896ea41103d87b2))
* **sdk-core:** Update para-to-para DOT error msg ⬆️ ([910a3e9](https://github.com/paraspell/xcm-tools/commit/910a3e9344697322cbb160547e6532951a6714fb))


### Code Refactoring

* Rename xcm call section property to method 𝌡 ([20fafb3](https://github.com/paraspell/xcm-tools/commit/20fafb38ae783343a428c860091ea67be53208f6))
* **sdk-core:** Remove assetCheck override & add eth balance direct support 🪄 ([e197298](https://github.com/paraspell/xcm-tools/commit/e1972982bedb20dcacf628c8e1b996bd7c709fb8))

## [10.3.1](https://github.com/paraspell/xcm-tools/compare/sdk-core-v10.3.0...sdk-core-v10.3.1) (2025-05-30)


### Code Refactoring

* Perform a monthly maintenance check ✨📆 ([bcfe0bd](https://github.com/paraspell/xcm-tools/commit/bcfe0bdeb645ebe3048b354cb4f242e9df0b02cf))
* **sdk-core:** Refactor XTokens pallet to be more modular 🧹 ([68d8968](https://github.com/paraspell/xcm-tools/commit/68d89687b5f33fb0bc4ea803f8373eaab5c28e8c))

## [10.3.0](https://github.com/paraspell/xcm-tools/compare/sdk-core-v10.2.0...sdk-core-v10.3.0) (2025-05-29)


### Features

* Migrate sdk-core to viem 🪄 ([f1fc5d6](https://github.com/paraspell/xcm-tools/commit/f1fc5d67eeb2b9bcebcdfa8981d8a57644191707))

## [10.2.0](https://github.com/paraspell/xcm-tools/compare/sdk-core-v10.1.7...sdk-core-v10.2.0) (2025-05-28)


### Miscellaneous Chores

* **sdk-core:** Synchronize main versions

## [10.1.7](https://github.com/paraspell/xcm-tools/compare/sdk-core-v10.1.6...sdk-core-v10.1.7) (2025-05-28)


### Miscellaneous Chores

* **sdk-core:** Synchronize main versions

## [10.1.6](https://github.com/paraspell/xcm-tools/compare/sdk-core-v10.1.5...sdk-core-v10.1.6) (2025-05-28)


### Bug Fixes

* **sdk-core:** Bump V2 calls to V3 ✨ ([2a652ff](https://github.com/paraspell/xcm-tools/commit/2a652ff27f7bc5e2670d422f6dbf1f043971973c))

## [10.1.5](https://github.com/paraspell/xcm-tools/compare/sdk-core-v10.1.4...sdk-core-v10.1.5) (2025-05-27)


### Miscellaneous Chores

* **sdk-core:** Synchronize main versions

## [10.1.4](https://github.com/paraspell/xcm-tools/compare/sdk-core-v10.1.3...sdk-core-v10.1.4) (2025-05-27)


### Bug Fixes

* **sdk-core:** Fix transfer info asset symbols 🔧 ([0337b31](https://github.com/paraspell/xcm-tools/commit/0337b31cf464937bda5f6eb1357767419744d13a))

## [10.1.3](https://github.com/paraspell/xcm-tools/compare/sdk-core-v10.1.2...sdk-core-v10.1.3) (2025-05-27)


### Miscellaneous Chores

* **sdk-core:** Synchronize main versions

## [10.1.2](https://github.com/paraspell/xcm-tools/compare/sdk-core-v10.1.1...sdk-core-v10.1.2) (2025-05-27)


### Bug Fixes

* **sdk-core:** Apply padding to execution fee for AH-&gt;Polimec transfer 🔧 ([ef2a3e4](https://github.com/paraspell/xcm-tools/commit/ef2a3e43d3d99daa3814bdfb423f50cccb7a39ee))

## [10.1.1](https://github.com/paraspell/xcm-tools/compare/sdk-core-v10.1.0...sdk-core-v10.1.1) (2025-05-26)


### Bug Fixes

* **sdk-core:** Fix getFee & getTransferInfo 🔧 ([aec9d3c](https://github.com/paraspell/xcm-tools/commit/aec9d3c9cd72d8ba8d1672aa98a72e87972371df))
* **sdk-core:** Fix incorrect origin when calculating dest fee 🛠️ ([6acebf1](https://github.com/paraspell/xcm-tools/commit/6acebf148c437f1cd7e5885e9b17eb82cce1aaf6))

## [10.1.0](https://github.com/paraspell/xcm-tools/compare/sdk-core-v10.0.2...sdk-core-v10.1.0) (2025-05-26)


### Features

* **sdk-core:** Enhance getTransferInfo ✨ ([bd568e0](https://github.com/paraspell/xcm-tools/commit/bd568e0a38d240224dea6adbc4791ad7a8674e26))

## [10.0.2](https://github.com/paraspell/xcm-tools/compare/sdk-core-v10.0.1...sdk-core-v10.0.2) (2025-05-23)


### Bug Fixes

* Use custom errors instead of generic errors to prevent HTTP 500 🔧 ([1e192da](https://github.com/paraspell/xcm-tools/commit/1e192da24e472997cb7b96901f8f2c7507a90630))

## [10.0.1](https://github.com/paraspell/xcm-tools/compare/sdk-core-v10.0.0...sdk-core-v10.0.1) (2025-05-22)


### Bug Fixes

* **sdk-core:** Use conversion fee if fee asset specified 🔧 ([01921b1](https://github.com/paraspell/xcm-tools/commit/01921b13c1f75761505a55a4579b45047f57503f))

## [10.0.0](https://github.com/paraspell/xcm-tools/compare/sdk-core-v9.2.2...sdk-core-v10.0.0) (2025-05-21)


### ⚠ BREAKING CHANGES

* **sdk-core:** Refactor transfer / fee helper functions 👷

### Code Refactoring

* **sdk-core:** Refactor transfer / fee helper functions 👷 ([1b33cb7](https://github.com/paraspell/xcm-tools/commit/1b33cb704fdca2b7c80d53384210761d3a85a76a))

## [9.2.2](https://github.com/paraspell/xcm-tools/compare/sdk-core-v9.2.1...sdk-core-v9.2.2) (2025-05-20)


### Miscellaneous Chores

* **sdk-core:** Synchronize main versions

## [9.2.1](https://github.com/paraspell/xcm-tools/compare/sdk-core-v9.2.0...sdk-core-v9.2.1) (2025-05-19)


### Miscellaneous Chores

* **sdk-core:** Synchronize main versions

## [9.2.0](https://github.com/paraspell/xcm-tools/compare/sdk-core-v9.1.2...sdk-core-v9.2.0) (2025-05-17)


### Features

* **xcm-router:** Add router XCM fees query 🪄 ([4b31830](https://github.com/paraspell/xcm-tools/commit/4b31830bbd36d91f49ca49101629185f529cc096))

## [9.1.2](https://github.com/paraspell/xcm-tools/compare/sdk-core-v9.1.1...sdk-core-v9.1.2) (2025-05-16)


### Bug Fixes

* **sdk-core:** Fix fee calculation for Manta destination 🔧 ([6291f02](https://github.com/paraspell/xcm-tools/commit/6291f02982dc74fe33d4a0b29889a5fb8fb1cf4f))

## [9.1.1](https://github.com/paraspell/xcm-tools/compare/sdk-core-v9.1.0...sdk-core-v9.1.1) (2025-05-16)


### Miscellaneous Chores

* **sdk-core:** Synchronize main versions

## [9.1.0](https://github.com/paraspell/xcm-tools/compare/sdk-core-v9.0.0...sdk-core-v9.1.0) (2025-05-15)


### Features

* **xcm-router:** Add asset pairs checks & expose function ✨ ([8c0d6a3](https://github.com/paraspell/xcm-tools/commit/8c0d6a3767cd54bdfed5b7a4905876fcd0bae22e))


### Miscellaneous Chores

* **main:** release main libraries ([7d1a8bd](https://github.com/paraspell/xcm-tools/commit/7d1a8bd18709af151783235794ea63efc6acfe89))

## [9.0.0](https://github.com/paraspell/xcm-tools/compare/sdk-core-v9.0.0...sdk-core-v9.0.0) (2025-05-14)


### Miscellaneous Chores

* **sdk-core:** Synchronize main versions

## [9.0.0](https://github.com/paraspell/xcm-tools/compare/sdk-core-v8.16.0...sdk-core-v9.0.0) (2025-05-13)


### Tests

* Fix SDK e2e tests 🔧 ([dd01275](https://github.com/paraspell/xcm-tools/commit/dd0127515c9c26782ca53a9382fa99f9a25f4c51))

## [8.16.0](https://github.com/paraspell/xcm-tools/compare/sdk-core-v8.15.2...sdk-core-v8.16.0) (2025-05-12)


### Features

* **sdk-core:** Add SS58 address conversion 🪄 ([be1dbd6](https://github.com/paraspell/xcm-tools/commit/be1dbd648d132b5e8ba39e3773192af2407ba4af))

## [8.15.2](https://github.com/paraspell/xcm-tools/compare/sdk-core-v8.15.1...sdk-core-v8.15.2) (2025-05-09)


### Bug Fixes

* **sdk-core:** Add ahAddress param to getOriginFeeDetails function 🔧 ([5325586](https://github.com/paraspell/xcm-tools/commit/53255868abaae3168cbbbfac01887356251a8215))

## [8.15.1](https://github.com/paraspell/xcm-tools/compare/sdk-core-v8.15.0...sdk-core-v8.15.1) (2025-05-09)


### Bug Fixes

* Fix Moonbeam ERC-20 asset balance fetching 🔧 ([5cb497b](https://github.com/paraspell/xcm-tools/commit/5cb497bd293b6ec92a95d04097e8ff07924296a7))

## [8.15.0](https://github.com/paraspell/xcm-tools/compare/sdk-core-v8.14.0...sdk-core-v8.15.0) (2025-05-07)


### Bug Fixes

* Add asset claim address validation 🪄 ([05851b3](https://github.com/paraspell/xcm-tools/commit/05851b3287e4ebce191752a908cbf4c61286dbb2))

## [8.14.0](https://github.com/paraspell/xcm-tools/compare/sdk-core-v8.13.2...sdk-core-v8.14.0) (2025-05-07)


### Features

* **sdk:** Add papi client pool 🪄 ([41f4597](https://github.com/paraspell/xcm-tools/commit/41f459710e986e1eaf5414d66d9291675886f3b9))

## [8.13.2](https://github.com/paraspell/xcm-tools/compare/sdk-core-v8.13.1...sdk-core-v8.13.2) (2025-05-06)


### Bug Fixes

* **sdk-core:** Fix dry run errors on Kusama ecosystem 🛠️ ([3fda754](https://github.com/paraspell/xcm-tools/commit/3fda75434dc25f4fa6bb7a4e61875869271ee916))

## [8.13.1](https://github.com/paraspell/xcm-tools/compare/sdk-core-v8.13.0...sdk-core-v8.13.1) (2025-05-05)


### Bug Fixes

* **sdk-core:** Fix incorrect balances returning on AH 🔧 ([d7b870d](https://github.com/paraspell/xcm-tools/commit/d7b870decca5b288fe760497ec022716190d0557))

## [8.13.0](https://github.com/paraspell/xcm-tools/compare/sdk-core-v8.12.1...sdk-core-v8.13.0) (2025-05-05)


### Features

* Improve dryRun function to check destination ✨ ([8c78c8c](https://github.com/paraspell/xcm-tools/commit/8c78c8c922d8b2b53b8979d0951586e81fc48ce3))

## [8.12.1](https://github.com/paraspell/xcm-tools/compare/sdk-core-v8.12.0...sdk-core-v8.12.1) (2025-05-01)


### Bug Fixes

* Fix Moonbeam -&gt; Ethereum transfer 🔧 ([8981eaf](https://github.com/paraspell/xcm-tools/commit/8981eaf9832a9145b31bbfc941136ebdcad33378))

## [8.12.0](https://github.com/paraspell/xcm-tools/compare/sdk-core-v8.11.1...sdk-core-v8.12.0) (2025-04-30)


### Features

* **sdk-core:** Add XCM fee queries ✨ ([1bcca3f](https://github.com/paraspell/xcm-tools/commit/1bcca3f45d45c47714a1ffb20d32c83486df2179))


### Miscellaneous Chores

* Perform monthly maintenance check ✨ ([2922557](https://github.com/paraspell/xcm-tools/commit/292255751429cb59dc5086b3f4dd93b4b4ee8f21))

## [8.11.1](https://github.com/paraspell/xcm-tools/compare/sdk-core-v8.11.0...sdk-core-v8.11.1) (2025-04-29)


### Bug Fixes

* **sdk-core:** Fix multi-location currency select ✨ ([58b11c0](https://github.com/paraspell/xcm-tools/commit/58b11c023135ab76c158a6b8b91840d73ba2b1f9))
* **sdk-core:** Upgrade deprecated reserve_transfer_assets transfers 🪄 ([f12793c](https://github.com/paraspell/xcm-tools/commit/f12793c18f807d9088f5d921c56223a921fb468b))

## [8.11.0](https://github.com/paraspell/xcm-tools/compare/sdk-core-v8.10.0...sdk-core-v8.11.0) (2025-04-22)


### Features

* **sdk-core:** Add support for local transfers 🪄 ([fcefd1a](https://github.com/paraspell/xcm-tools/commit/fcefd1a3fe0ea93c5701c9544f43ae9f870597d3))

## [8.10.0](https://github.com/paraspell/xcm-tools/compare/sdk-core-v8.9.10...sdk-core-v8.10.0) (2025-04-17)


### Features

* **sdk-core:** Add support for various type_and_then xcm calls ✨ ([08d4f19](https://github.com/paraspell/xcm-tools/commit/08d4f19510cdffff049c1a1d0e79c488f408e516))

## [8.9.10](https://github.com/paraspell/xcm-tools/compare/sdk-core-v8.9.9...sdk-core-v8.9.10) (2025-04-15)


### Miscellaneous Chores

* **sdk-core:** Synchronize main versions

## [8.9.9](https://github.com/paraspell/xcm-tools/compare/sdk-core-v8.9.8...sdk-core-v8.9.9) (2025-04-14)


### Bug Fixes

* Add Ethereum bridge status checks 🛠️ ([7347cca](https://github.com/paraspell/xcm-tools/commit/7347cca0b43fc900028951db05b2217b3be19573))

## [8.9.8](https://github.com/paraspell/xcm-tools/compare/sdk-core-v8.9.7...sdk-core-v8.9.8) (2025-04-10)


### Miscellaneous Chores

* **sdk-core:** Synchronize main versions

## [8.9.7](https://github.com/paraspell/xcm-tools/compare/sdk-core-v8.9.6...sdk-core-v8.9.7) (2025-04-09)


### Bug Fixes

* **assets:** Add relay assets multi-locations ✨ ([e3a4631](https://github.com/paraspell/xcm-tools/commit/e3a4631bda587536d969d5a09e0da61669a85b0c))
* **xcm-api:** Fix XCM-API error handling & playground request forming 💻 ([4a8d962](https://github.com/paraspell/xcm-tools/commit/4a8d962b1852112b8b8b128647d38604b0c502c6))

## [8.9.6](https://github.com/paraspell/xcm-tools/compare/sdk-core-v8.9.5...sdk-core-v8.9.6) (2025-04-07)


### Bug Fixes

* **sdk-core:** Fix Pendulum DOT transfers ([5c62578](https://github.com/paraspell/xcm-tools/commit/5c62578da516f28b31ccee1d396b3cc46548d88e))

## [8.9.5](https://github.com/paraspell/xcm-tools/compare/sdk-core-v8.9.4...sdk-core-v8.9.5) (2025-04-07)


### Bug Fixes

* **sdk-core:** Fix AssetHub transfers 🔧 ([5c4e223](https://github.com/paraspell/xcm-tools/commit/5c4e2232da0c865f5d35ce9f8be1f994ddc4e5b0))
* **sdk-core:** Fix Manta native asset transfers 🪛 ([803c4be](https://github.com/paraspell/xcm-tools/commit/803c4be7b153f79bfe6921bc9525564c55c9edaf))

## [8.9.4](https://github.com/paraspell/xcm-tools/compare/sdk-core-v8.9.3...sdk-core-v8.9.4) (2025-04-06)


### Miscellaneous Chores

* Enable Relay &gt; Pendulum & Pendulum Para PEN ([c0fb1f5](https://github.com/paraspell/xcm-tools/commit/c0fb1f50f4003c40db6d3c3e5e73086285452e6b))

## [8.9.3](https://github.com/paraspell/xcm-tools/compare/sdk-core-v8.9.2...sdk-core-v8.9.3) (2025-04-01)


### Miscellaneous Chores

* **sdk-core:** Synchronize main versions

## [8.9.2](https://github.com/paraspell/xcm-tools/compare/sdk-core-v8.9.1...sdk-core-v8.9.2) (2025-03-27)


### Miscellaneous Chores

* Add unit tests ([70d0e12](https://github.com/paraspell/xcm-tools/commit/70d0e124476809b33168ec25e4264fb5024e0f03))
* Fix lint ([70d0e12](https://github.com/paraspell/xcm-tools/commit/70d0e124476809b33168ec25e4264fb5024e0f03))
* Perform a monthly check 🪄 ([d0e49e1](https://github.com/paraspell/xcm-tools/commit/d0e49e1d808e81e3179ff64a714f89559b46c6f8))
* Perform a monthly check 🪄 ([baa54a1](https://github.com/paraspell/xcm-tools/commit/baa54a1e37ea1324643005c813983fe5ef86dbf8))
* Update format ([70d0e12](https://github.com/paraspell/xcm-tools/commit/70d0e124476809b33168ec25e4264fb5024e0f03))
* Update SB ([70d0e12](https://github.com/paraspell/xcm-tools/commit/70d0e124476809b33168ec25e4264fb5024e0f03))

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
