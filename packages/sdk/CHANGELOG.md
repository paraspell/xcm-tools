# Changelog

## [8.0.0](https://github.com/paraspell/xcm-tools/compare/sdk-v7.2.8...sdk-v8.0.0) (2024-12-14)


### ⚠ BREAKING CHANGES

* **sdk:** Refactor transfer Builder to explicitly include from, to parameters for relaychains

### Features

* **playground:** Add support for multi-assets to playground 🛝 ([3ea98c7](https://github.com/paraspell/xcm-tools/commit/3ea98c73ea27867c632c6bf8a360c5aec647c0b6))
* **sdk:** Add fail-safe support ✨ ([2300960](https://github.com/paraspell/xcm-tools/commit/2300960e3f02c19d6951365b40581e5768ea8280))
* **sdk:** Refactor transfer Builder to explicitly include from, to parameters for relaychains ([14656a0](https://github.com/paraspell/xcm-tools/commit/14656a065f926aad9078516532d7ad6f0e374720))


### Miscellaneous Chores

* **sdk:** Add changes ([c02b149](https://github.com/paraspell/xcm-tools/commit/c02b1492ec9bb3201c75b2fed005d4728b368c8a))
* **sdk:** fix readme ([7234899](https://github.com/paraspell/xcm-tools/commit/72348995f9a560166d0e275ca270c443d101eff4))

## [7.2.8](https://github.com/paraspell/xcm-tools/compare/sdk-v7.2.7...sdk-v7.2.8) (2024-12-14)


### Bug Fixes

* **sdk:** Fix incomplete Assethub asset symbols 🔧 ([f03aa32](https://github.com/paraspell/xcm-tools/commit/f03aa32e243051e9caf3474884863e737bc7030e))

## [7.2.7](https://github.com/paraspell/xcm-tools/compare/sdk-v7.2.6...sdk-v7.2.7) (2024-12-11)


### Bug Fixes

* **sdk:** Fix Centrifuge balance query 🔧 ([f780996](https://github.com/paraspell/xcm-tools/commit/f78099684042d4b2427cc258a7c62464d2d1e897))

## [7.2.6](https://github.com/paraspell/xcm-tools/compare/sdk-v7.2.5...sdk-v7.2.6) (2024-12-07)


### Bug Fixes

* **sdk:** Add existential deposits for foreign assets ✨ ([0c9b2bf](https://github.com/paraspell/xcm-tools/commit/0c9b2bfbb5bdc7309b74af21c7dfcef35aac2967))

## [7.2.5](https://github.com/paraspell/xcm-tools/compare/sdk-v7.2.4...sdk-v7.2.5) (2024-11-30)


### Miscellaneous Chores

* Perform November monthly check 🔧 ([6aceb38](https://github.com/paraspell/xcm-tools/commit/6aceb38be5fd65c9f7dbfd037bdcc947c9cf37d8))

## [7.2.4](https://github.com/paraspell/xcm-tools/compare/sdk-v7.2.3...sdk-v7.2.4) (2024-11-26)


### Bug Fixes

* **sdk:** Fix transfer from Polimec to AHP 🔧 ([c2b116c](https://github.com/paraspell/xcm-tools/commit/c2b116c4bd6250c3a58cf2c587543b8c9d93ccc1))


### Code Refactoring

* **sdk:** Refactor ParaToPara and ParaToRelay transfer function 🧑‍💻 ([4d49456](https://github.com/paraspell/xcm-tools/commit/4d49456273141a9b973cb31d481331c542e96dac))
* **sdk:** Refactor transferRelayToPara function 🔧 ([608ff63](https://github.com/paraspell/xcm-tools/commit/608ff638c012fd9c69d44097317d31f424855ede))

## [7.2.3](https://github.com/paraspell/xcm-tools/compare/sdk-v7.2.2...sdk-v7.2.3) (2024-11-24)


### Bug Fixes

* Add destination address checks ([f072da7](https://github.com/paraspell/xcm-tools/commit/f072da7c032ed9fb871191f4975115e779608ed0))
* **sdk:** Fix Moonbeam & Moonriver transfer 🔧 ([f5343f3](https://github.com/paraspell/xcm-tools/commit/f5343f354de1a2568c363facbff455db4a1dfb42))
* **xcm-api:** Remove old XCM API code 👴 ([973dfde](https://github.com/paraspell/xcm-tools/commit/973dfde2cc6206ebdee90b45bda1cd871c0063b3))

## [7.2.2](https://github.com/paraspell/xcm-tools/compare/sdk-v7.2.1...sdk-v7.2.2) (2024-11-19)


### Bug Fixes

* **sdk:** Fix getOriginFeeDetails API disconnect 🛠️ ([346ecd0](https://github.com/paraspell/xcm-tools/commit/346ecd0c953f861850290da8ca1494f643388a48))
* **sdk:** Properly disconnect auto-created API client ✅ ([50735d5](https://github.com/paraspell/xcm-tools/commit/50735d59188c093de293836329bed474cd4c815b))

## [7.2.1](https://github.com/paraspell/xcm-tools/compare/sdk-v7.2.0...sdk-v7.2.1) (2024-11-19)


### Bug Fixes

* **sdk:** Fix Bifrost balance fetching 🔧 ([50455ef](https://github.com/paraspell/xcm-tools/commit/50455ef9e72a25fbfc820583e11d7b05651228a0))

## [7.2.0](https://github.com/paraspell/xcm-tools/compare/sdk-v7.1.2...sdk-v7.2.0) (2024-11-16)


### Features

* **sdk:** Add asset search by multi-location ✨ ([54d0d46](https://github.com/paraspell/xcm-tools/commit/54d0d46d96e4b17b315856a61563a13209fef026))
* **sdk:** Add support for abstracted assets selection ✨ ([b5ffed8](https://github.com/paraspell/xcm-tools/commit/b5ffed8958aa5680a5ffc9308f0f7f0dd1c1d727))


### Bug Fixes

* **sdk:** Fix asset checks relaychain symbol validation 🛠️ ([bc498ac](https://github.com/paraspell/xcm-tools/commit/bc498ace69ba6b76810cb2aa95969d2027ddfddc))
* **sdk:** Remove @polkadot/apps-config depencency ([8a5bbc7](https://github.com/paraspell/xcm-tools/commit/8a5bbc7e5f31ec928e4be2714a69f666fd706fd1))


### Miscellaneous Chores

* **sdk:** Add advanced symbol selection info ([a4db9c3](https://github.com/paraspell/xcm-tools/commit/a4db9c3dc33768cd247980454f4bbcce3fe49689))
* **sdk:** Update readme with PJS-less PAPI version ([896bc60](https://github.com/paraspell/xcm-tools/commit/896bc600bbe44efa1b2c26db691b230b7fec7db5))
* **sdk:** Update README.md ([0fd4655](https://github.com/paraspell/xcm-tools/commit/0fd4655627a7e643d7fff52af8cee9720a91e6b8))
* **xcm-tools:** Update readme ([66f9278](https://github.com/paraspell/xcm-tools/commit/66f92788d60589dc92e0ec388b1870968551fcbe))

## [7.1.2](https://github.com/paraspell/xcm-tools/compare/sdk-v7.1.1...sdk-v7.1.2) (2024-11-05)


### Bug Fixes

* **sdk:** Add support for AHP &gt; BifrostPolkadot transfer 🔧 ([8a5823b](https://github.com/paraspell/xcm-tools/commit/8a5823be4faa8963a833864f761ae765bfb4485d))
* **sdk:** Fix Snowbridge asset selection ✨ ([8a2709f](https://github.com/paraspell/xcm-tools/commit/8a2709fdfbff7a94a42a7cfebebd0b5f57cac7d0))

## [7.1.1](https://github.com/paraspell/xcm-tools/compare/sdk-v7.1.0...sdk-v7.1.1) (2024-11-04)


### Bug Fixes

* **sdk:** Fix Hydration &lt;&gt; AHP transfers 🔧 ([8f5965d](https://github.com/paraspell/xcm-tools/commit/8f5965db50c12e2b46e550d7c9c0cffe0237516e))

## [7.1.0](https://github.com/paraspell/xcm-tools/compare/sdk-v7.0.1...sdk-v7.1.0) (2024-11-04)


### Features

* **sdk:** Add support to Hydration &gt; Ethereum transfer 🪄 ([b6f4c81](https://github.com/paraspell/xcm-tools/commit/b6f4c818bf53d3a0ed080a6f1d7959a08cb97556))
* **sdk:** Allow to pass RPC url to create API client ✨ ([6fb3af9](https://github.com/paraspell/xcm-tools/commit/6fb3af9cbc58921189ce7c6cdceabb10d5271dcd))


### Bug Fixes

* **sdk:** Fix USDT transfer from Bifrost to AssetHub ✏️ ([68eb167](https://github.com/paraspell/xcm-tools/commit/68eb16742e8d187de78d8d86d28ed5296be4ccc9))


### Miscellaneous Chores

* **sdk:** Update optional ws_url parameter ([c6fb8ae](https://github.com/paraspell/xcm-tools/commit/c6fb8aea82236e3a2fbb95ade336744f96396886))

## [7.0.1](https://github.com/paraspell/xcm-tools/compare/sdk-v7.0.0...sdk-v7.0.1) (2024-11-01)


### Bug Fixes

* **sdk:** Fix Moonbeam 'xc' prefix handling 🔧 ([a986bf8](https://github.com/paraspell/xcm-tools/commit/a986bf886f977499057a5ed49cb078953b770330))

## [7.0.0](https://github.com/paraspell/xcm-tools/compare/sdk-v6.2.4...sdk-v7.0.0) (2024-11-01)


### ⚠ BREAKING CHANGES

* **sdk:** Add PolkadotAPI(PAPI) support ✨

### Features

* **sdk:** Add PolkadotAPI(PAPI) support ✨ ([b3a1e72](https://github.com/paraspell/xcm-tools/commit/b3a1e72f11d13b7f43f077bb2f68cb27903cc7cc))


### Bug Fixes

* **playground:** Remove Ethereum option from some selects ✨ ([825702e](https://github.com/paraspell/xcm-tools/commit/825702e55f2cfab2d52f0c3c6bfcab7904b285a5))
* **sdk:** Fix and improve getAssetBalance function 🔧 ([395dc7c](https://github.com/paraspell/xcm-tools/commit/395dc7c4e5b0727ea9d8b25eeb82c67d43b41509))


### Miscellaneous Chores

* Perform a monthly check 🛠️ ([46a8802](https://github.com/paraspell/xcm-tools/commit/46a8802cb68a49b28f131b337e5b4b4731e01fd4))
* **sdk:** Update docs about PAPI ([50db221](https://github.com/paraspell/xcm-tools/commit/50db221e01294d42855318d5c7f3516cd85ca3b5))
* **sdk:** Update README.md ([a7dad60](https://github.com/paraspell/xcm-tools/commit/a7dad60befc0f97c647ea79b525622d7aa1397d2))
* **sdk:** Update README.md ([1fbb395](https://github.com/paraspell/xcm-tools/commit/1fbb395d04466e3cbf34e13617faabe62dd6bb40))

## [6.2.4](https://github.com/paraspell/xcm-tools/compare/sdk-v6.2.3...sdk-v6.2.4) (2024-10-25)


### Bug Fixes

* **sdk:** Add relaychain support for getTNode function ⚙️ ([c8fdf3e](https://github.com/paraspell/xcm-tools/commit/c8fdf3eec9c3feddec8cbcc65ad566ba1d8a8f40))

## [6.2.3](https://github.com/paraspell/xcm-tools/compare/sdk-v6.2.2...sdk-v6.2.3) (2024-10-24)


### Bug Fixes

* **sdk:** Export getOriginFeeDetails function 📦 ([41fe7a0](https://github.com/paraspell/xcm-tools/commit/41fe7a06e25f9b4b4e5083139c8f5e8aec212257))

## [6.2.2](https://github.com/paraspell/xcm-tools/compare/sdk-v6.2.1...sdk-v6.2.2) (2024-10-23)


### Bug Fixes

* **sdk:** Fix transfer info invalid currency error handling 🛠️ ([139bcfc](https://github.com/paraspell/xcm-tools/commit/139bcfcddc487216c6cc4992bfb168b017e676c6))

## [6.2.1](https://github.com/paraspell/xcm-tools/compare/sdk-v6.2.0...sdk-v6.2.1) (2024-10-21)


### Bug Fixes

* **sdk:** Fix Bifrost transfers 🛠️ ([9eb6a2b](https://github.com/paraspell/xcm-tools/commit/9eb6a2bc88d471b56d26d3c99c3b1df3bd15c66e))

## [6.2.0](https://github.com/paraspell/xcm-tools/compare/sdk-v6.1.1...sdk-v6.2.0) (2024-10-19)


### Features

* **xcm-api:** Add balance queries to XCM-API 👨‍🔧 ([4475ea7](https://github.com/paraspell/xcm-tools/commit/4475ea721765638fd4d69681e9613bfd6023a3a7))


### Bug Fixes

* **sdk:** Fix AssetHub transfer issues 🔧 ([412c9ab](https://github.com/paraspell/xcm-tools/commit/412c9ab6f595ee6729167d8f4868784ed11c8031))


### Documentation

* Add TSDoc reference comments to exported functions 📄 ([73b8cfe](https://github.com/paraspell/xcm-tools/commit/73b8cfe6d0944a0ea2c649552c844501ad10b19c))


### Miscellaneous Chores

* Add consistent type imports ESlint rule ✏️ ([61c20ae](https://github.com/paraspell/xcm-tools/commit/61c20ae24b83d871a6a5e3819e09748df3026061))
* **xcm-tools:** Add starter template projects to readme ([8e9cbf7](https://github.com/paraspell/xcm-tools/commit/8e9cbf7f6a8c25e7bf7dd48287d0dd66557c4c02))


### Code Refactoring

* **sdk:** Generalize Builder class - preparation for PAPI implementation 🛠️ ([5d3f34f](https://github.com/paraspell/xcm-tools/commit/5d3f34f8937d33e8a3d823988a8966f841ae9064))
* **sdk:** Generalize PolkadotJS code ⚙️ ([582fbdf](https://github.com/paraspell/xcm-tools/commit/582fbdfce3c907cc464352867bc80d007f81cc99))


### Tests

* Improve overall unit test coverage to above 90% 🧪 ([aeb32bb](https://github.com/paraspell/xcm-tools/commit/aeb32bb6a54c1bc2e527cf587b8e0a44e3c397a5))
* **sdk:** Correctly mock ApiPromise in Builder / transfer tests 🧪 ([8e01c4f](https://github.com/paraspell/xcm-tools/commit/8e01c4f6fd40190b6be4cae7d1adf14533cd964d))

## [6.1.1](https://github.com/paraspell/xcm-tools/compare/sdk-v6.1.0...sdk-v6.1.1) (2024-09-30)


### Miscellaneous Chores

* **sdk:** Remove docs and replace link in Readme ([bfa11cd](https://github.com/paraspell/xcm-tools/commit/bfa11cd2c3d8493ceb73a6b45ae8cba3c2cfb33d))
* **sdk:** Update README.md ([48b950a](https://github.com/paraspell/xcm-tools/commit/48b950a5f004fbcc5a14c13dba33830d0ea75613))

## [6.1.0](https://github.com/paraspell/xcm-tools/compare/sdk-v6.0.0...sdk-v6.1.0) (2024-09-30)


### Features

* Add ParaSpell landing page ([91ceeba](https://github.com/paraspell/xcm-tools/commit/91ceeba999473cd618edae70f028f5e2bdfd25d9))


### Miscellaneous Chores

* Perform monthly maintenance check 🛠️ ([e85ed15](https://github.com/paraspell/xcm-tools/commit/e85ed15e709ccf3b59f7aa8c0fcaf7134e0fe8a3))

## [6.0.0](https://github.com/paraspell/xcm-tools/compare/sdk-v5.10.0...sdk-v6.0.0) (2024-09-21)


### ⚠ BREAKING CHANGES

* **sdk:** Refactor asset selection 🛠️

### Features

* **playground:** Add E2E tests using Playwright 🧪 ([ebb5ad2](https://github.com/paraspell/xcm-tools/commit/ebb5ad21a399abed42dcea7be2fff678acea8f21))
* Remove HRMP channel functionality ([d7b4f0d](https://github.com/paraspell/xcm-tools/commit/d7b4f0d3d8303e64debb39efcca355ceee80412d))
* **sdk:** Add Coretime Polkadot parachain ✨ ([8e6510e](https://github.com/paraspell/xcm-tools/commit/8e6510e574d021a1b0ac0a3b878e575a86823c1e))
* **sdk:** Add foreignAssets pallet multi-location checks ([eb2f190](https://github.com/paraspell/xcm-tools/commit/eb2f190c9f270f6a8117229c8fbf58e33409f160))
* **sdk:** Refactor asset selection 🛠️ ([5e54a11](https://github.com/paraspell/xcm-tools/commit/5e54a11086383699e4f2096e36610c96cc476306))
* **xcm-api:** Add support for new currency input types ✨ ([5d8655a](https://github.com/paraspell/xcm-tools/commit/5d8655a50e26b9c2ca110acfb2caa187e889d581))
* **xcm-router:** Refactor currency inputs ✨ ([28db4a9](https://github.com/paraspell/xcm-tools/commit/28db4a918f896f496a5b8c984d9f0413d6f827ae))


### Bug Fixes

* Fix ignored ESlint errors 🔧 ([495fc06](https://github.com/paraspell/xcm-tools/commit/495fc067758db128df1d0c46c1c2534dc28aaf3f))


### Code Refactoring

* **sdk:** Add types for method property ✨ ([58abfb6](https://github.com/paraspell/xcm-tools/commit/58abfb6efcb3bcaa3bf12ea62399806cb6680c75))


### Build System

* **sdk:** Setup more benevolent peer dependencies 📦 ([be65545](https://github.com/paraspell/xcm-tools/commit/be655457f7673e5c5d47cc7ccb39278fe7463989))


### Continuous Integration

* Setup Codecov bundle analysis 📦 ([c3e0e53](https://github.com/paraspell/xcm-tools/commit/c3e0e535cef0e2d8dd77035cb10ee596163d54a0))

## [5.10.0](https://github.com/paraspell/xcm-tools/compare/sdk-v5.9.0...sdk-v5.10.0) (2024-08-30)


### Features

* **sdk:** Add support for batch utility to Builder ✨ ([4163a52](https://github.com/paraspell/xcm-tools/commit/4163a52a5c84a7409e045467c68ed49435eb01e5))
* **xcm-api:** Add support for directly returning hex of extrinsics ✨ ([566fac3](https://github.com/paraspell/xcm-tools/commit/566fac3541d05184f1776afeb49ae5148b32f778))
* **xcm-api:** Add support for XCM Router API Snowbridge transfers ([c468a80](https://github.com/paraspell/xcm-tools/commit/c468a804845fa3fd78649f01af7eee32a7305aae))


### Bug Fixes

* **sdk:** Fix Astar and Shiden native asset transfers 🪲 ([da13fd2](https://github.com/paraspell/xcm-tools/commit/da13fd287fa6efa4e071bf564b06acaf1050d6d9))


### Miscellaneous Chores

* Perform montly check ✨ ([3f20805](https://github.com/paraspell/xcm-tools/commit/3f20805195f11ca9f37c57f1c6ee6e37c07f6edc))
* **sdk:** Add readme ([029bf6f](https://github.com/paraspell/xcm-tools/commit/029bf6f5892f564d51387fb24a6dd7ab9bb0ce92))
* **xcm-tools:** Update readme to reflect latest changes ([65c7a72](https://github.com/paraspell/xcm-tools/commit/65c7a72963eaf9eaba147a13c2b9da654d5cf8fb))

## [5.9.0](https://github.com/paraspell/xcm-tools/compare/sdk-v5.8.0...sdk-v5.9.0) (2024-08-12)


### Features

* Add Select component for selecting assets ([850483f](https://github.com/paraspell/xcm-tools/commit/850483fc75dbef266b46a5bbb15da8517985c620))


### Bug Fixes

* **sdk:** Fix Mythos transfer & assets ([d46f739](https://github.com/paraspell/xcm-tools/commit/d46f7394f7cc686448dd556b5655ee991f891c2a))


### Code Refactoring

* **sdk:** Add types and remove 'any' from TTransfer.ts file 🧩 ([3c50ba7](https://github.com/paraspell/xcm-tools/commit/3c50ba7070fbae9eb2a71b72c054be94ef884525))


### Continuous Integration

* Integrate Codecov PR comments 💬 ([220da1b](https://github.com/paraspell/xcm-tools/commit/220da1b6d060b7aa4d8262e779256e40ce145f3f))

## [5.8.0](https://github.com/paraspell/xcm-tools/compare/sdk-v5.7.0...sdk-v5.8.0) (2024-08-02)


### Features

* **sdk:** Add support for AHP -&gt; MYTHOS transfers 🛠️ ([c29c630](https://github.com/paraspell/xcm-tools/commit/c29c630689916c763f0ed88c2bc5879348ce405f))
* **sdk:** Enable direct entry of asset symbol or ID as currency ✨ ([987be79](https://github.com/paraspell/xcm-tools/commit/987be79ddd7198f541654cd8c5353c714f3caf37))

## [5.7.0](https://github.com/paraspell/xcm-tools/compare/sdk-v5.6.0...sdk-v5.7.0) (2024-07-27)


### Features

* Add support for Snowbridge transfers (Ethereum -&gt; Polkadot) ❄️ ([2f16524](https://github.com/paraspell/xcm-tools/commit/2f165245137766d4d11cc5f8a592082f68fc4ff8))
* Add support for Snowbridge transfers (Polkadot -&gt; Ethereum) ❄️ ([631cd55](https://github.com/paraspell/xcm-tools/commit/631cd5562a9efdde991276daafc16fc72b635287))


### Miscellaneous Chores

* **sdk:** Perform monthly maintenance check 🛠️ ([71e0bdd](https://github.com/paraspell/xcm-tools/commit/71e0bdd6e4df2c87bb428a66d6dea637131f27c1))
* **sdk:** Update readme ([c64e35b](https://github.com/paraspell/xcm-tools/commit/c64e35b7de41f396f15bddc8716c15a0c975662d))
* **sdk:** Update Readme ([8599604](https://github.com/paraspell/xcm-tools/commit/85996041d51228502b33ac0e1216a941b8db715e))
* Update docs ([1cea10f](https://github.com/paraspell/xcm-tools/commit/1cea10f78a1377ce4526dba7a54ad3a806afc024))
* Update Polkadot dependencies to latest version ([319ec70](https://github.com/paraspell/xcm-tools/commit/319ec70e4f3771f0ca339f770d6474a8fcceb8ed))


### Code Refactoring

* Upgrade ESlint to v9 & create shared config ([524161b](https://github.com/paraspell/xcm-tools/commit/524161b9a9509c3beb15af99bfc0151c7eeb5619))

## [5.6.0](https://github.com/paraspell/xcm-tools/compare/sdk-v5.5.0...sdk-v5.6.0) (2024-06-30)


### Features

* Add playground "use API" option to transfer-info & asset claim ([8d9bbcb](https://github.com/paraspell/xcm-tools/commit/8d9bbcb602de89fee28def064bf9d765a711c7e5))
* Add support for V4 MultiAsset ([3d6c68b](https://github.com/paraspell/xcm-tools/commit/3d6c68b9b146aa0d42210e84b0f332c3bf60c0aa))
* **sdk:** Add ability to override XCM version ✨ ([3a5459c](https://github.com/paraspell/xcm-tools/commit/3a5459c2b54535e98db82d86bd11a4a3e7d9b329))
* **xcm-router:** Add support for EVM signer ([569f4fc](https://github.com/paraspell/xcm-tools/commit/569f4fc3e0316df4ac82a1b4f3714a7528548c14))


### Bug Fixes

* Fix WS endpoints timing out ([32f34b8](https://github.com/paraspell/xcm-tools/commit/32f34b8eecaf46be06b968bbd97b817860dd8e52))


### Miscellaneous Chores

* Perform monthly maintenance check ([5b1b76a](https://github.com/paraspell/xcm-tools/commit/5b1b76a249d52568488242908581fe061dee2750))
* **sdk:** Fix typos ([678eb6a](https://github.com/paraspell/xcm-tools/commit/678eb6ac5ee4c5beed067891599d73e70ee9564e))
* Update SDK dependencies ⚙️ ([281d5c7](https://github.com/paraspell/xcm-tools/commit/281d5c7a5fd043c7a5b3d323218ccfdba9ef0a56))


### Code Refactoring

* **sdk:** Remove duplicate code from Astar, Shiden classes ([c347cd0](https://github.com/paraspell/xcm-tools/commit/c347cd021abd983b7f8c8544ebee281f9f1695e2))

## [5.5.0](https://github.com/paraspell/xcm-tools/compare/sdk-v5.4.2...sdk-v5.5.0) (2024-06-08)


### Features

* Add support for Polkadot and Kusama bridge ([0b935fe](https://github.com/paraspell/xcm-tools/commit/0b935fecf6e49e7e58abb1efee239bce53126a0b))


### Bug Fixes

* Fix maps JSON print width ([a98814b](https://github.com/paraspell/xcm-tools/commit/a98814b801365a729bc89d101cd73a84619c25ff))

## [5.4.2](https://github.com/paraspell/xcm-tools/compare/sdk-v5.4.1...sdk-v5.4.2) (2024-06-02)


### Miscellaneous Chores

* **sdk:** Add transfer info docs ([7754941](https://github.com/paraspell/xcm-tools/commit/7754941e639f75d0e3882cc627103c0881d0c148))

## [5.4.1](https://github.com/paraspell/xcm-tools/compare/sdk-v5.4.0...sdk-v5.4.1) (2024-05-31)


### Miscellaneous Chores

* **sdk:** Run maintenance scripts ([2503c84](https://github.com/paraspell/xcm-tools/commit/2503c8441bbd628570da366d4bee6a68e7b329b7))
* **sdk:** run prettier ([936d9a3](https://github.com/paraspell/xcm-tools/commit/936d9a31e1733bb5bef7b854483f87531bed9cf0))
* **sdk:** Update README.md ([eb79ad1](https://github.com/paraspell/xcm-tools/commit/eb79ad18d34482aac6223156bdd2a1139d08b88b))
* **sdk:** Update supportedNodes.md ([08bc76e](https://github.com/paraspell/xcm-tools/commit/08bc76e918f5a3baaa37ace223adebfc7005ce65))


### Code Refactoring

* Refactor scripts code ([91db3fe](https://github.com/paraspell/xcm-tools/commit/91db3fe2a1bdaecee5ef469a40725b0c334a9947))

## [5.4.0](https://github.com/paraspell/xcm-tools/compare/sdk-v5.3.0...sdk-v5.4.0) (2024-05-24)


### Features

* Add support for querying balances for parachains ([c236def](https://github.com/paraspell/xcm-tools/commit/c236def6abec0f484febc247a62ac86f2b429241))
* update TransferInfo ([931c4e0](https://github.com/paraspell/xcm-tools/commit/931c4e0f1f789f204a5b8950295a95e7b29c4499))


### Miscellaneous Chores

* **sdk:** Update supportedNodes.md ([f9b13ec](https://github.com/paraspell/xcm-tools/commit/f9b13eca32a4f178406ec404283ddaed27927ea8))

## [5.3.0](https://github.com/paraspell/xcm-tools/compare/sdk-v5.2.1...sdk-v5.3.0) (2024-05-20)


### Features

* Add support for asset claim 🔧 ([b02f8ed](https://github.com/paraspell/xcm-tools/commit/b02f8ed5af5a78598cca2af1e16ddb5c4a55ea4b))
* Add support for Curio chain ([f1197c5](https://github.com/paraspell/xcm-tools/commit/f1197c55b3c048a42533933bfca2b52cfa33be91))
* Add support for overriding multi assets ([e35e521](https://github.com/paraspell/xcm-tools/commit/e35e521dde4f12adf4d03da9ab07476bdbee455e))


### Miscellaneous Chores

* **sdk:** Add claimAssets+MultiassetArray to Readme ([99abab9](https://github.com/paraspell/xcm-tools/commit/99abab9aa42e4506122fd5e281ec9126e198dd11))
* **sdk:** Fix supportedNodes.md ([9dcee6c](https://github.com/paraspell/xcm-tools/commit/9dcee6c8184f35f1e57af3eed722bed18fca403e))
* **sdk:** Update supportedNodes.md ([6743d23](https://github.com/paraspell/xcm-tools/commit/6743d23c9ff46b1a7f875f1bd9cc72f1bdba11c0))
* Update Node.js to v20 LTS ([4b00caa](https://github.com/paraspell/xcm-tools/commit/4b00caa58649051f4dea57e7f6ebb94baa6e307a))

## [5.2.1](https://github.com/paraspell/xcm-tools/compare/sdk-v5.2.0...sdk-v5.2.1) (2024-04-30)


### Miscellaneous Chores

* **sdk:** Update readme and docs ([f8d6613](https://github.com/paraspell/xcm-tools/commit/f8d6613a77d302229fac98e427b040096111eb24))

## [5.2.0](https://github.com/paraspell/xcm-tools/compare/sdk-v5.1.0...sdk-v5.2.0) (2024-04-30)


### Features

* **sdk:** Allow fee asset customization ⚙️ ([a42be92](https://github.com/paraspell/xcm-tools/commit/a42be924a70faf323b59de24c528e2294408c1a2))


### Miscellaneous Chores

* **sdk:** Perform monthly check ⚙️ ([0edf441](https://github.com/paraspell/xcm-tools/commit/0edf441af391711f4884032a8ed0f9c3b1818cc6))
* **sdk:** Update documentation ([aec7f13](https://github.com/paraspell/xcm-tools/commit/aec7f1305ba011de8f11f32cd011100bdbec8ba5))
* **sdk:** Update License ([042a62b](https://github.com/paraspell/xcm-tools/commit/042a62bf4e90412e55552b053042619fe8559033))


### Code Refactoring

* **sdk:** Add types for MultiLocations structures ([13c417b](https://github.com/paraspell/xcm-tools/commit/13c417b1d57d8cfa81a669692e1c24d1be2b5a73))
* **sdk:** Split types.ts file into multiple organized type definition files ([951e6ca](https://github.com/paraspell/xcm-tools/commit/951e6ca2d7b77d5b04aba2f594634155ddd1dddd))
* **sdk:** Update README.md ([8330056](https://github.com/paraspell/xcm-tools/commit/8330056bd37e916e734dec8709d6001648cc5ede))

## [5.1.0](https://github.com/paraspell/xcm-tools/compare/sdk-v5.0.1...sdk-v5.1.0) (2024-04-13)


### Features

* **sdk:** Add MultiLocation override feature ⛓️ ([eb6cdbe](https://github.com/paraspell/xcm-tools/commit/eb6cdbedd8bdfb2570e0bc94192afe6079a20b11))

## [5.0.1](https://github.com/paraspell/xcm-tools/compare/sdk-v5.0.0...sdk-v5.0.1) (2024-04-11)


### Bug Fixes

* add asset symbol and decimal ([bafb8d9](https://github.com/paraspell/xcm-tools/commit/bafb8d9c9c117080066a9043e8c3fdcd4eb4aeec))
* **sdk:** Repair decimals ([19acd63](https://github.com/paraspell/xcm-tools/commit/19acd63908202c1978377079c2370b8708c758f4))
* **sdk:** Repair formatter ([172050b](https://github.com/paraspell/xcm-tools/commit/172050bcb9d496f0a2c46e13a274e5d6f370265a))


### Miscellaneous Chores

* added DED token ([63539fd](https://github.com/paraspell/xcm-tools/commit/63539fd5037889f1e64840181952c6d43e2271c8))
* added USDC asset id ([d7ef963](https://github.com/paraspell/xcm-tools/commit/d7ef96309d02220b20bca3b69621c860702070d8))

## [5.0.0](https://github.com/paraspell/xcm-tools/compare/sdk-v4.1.1...sdk-v5.0.0) (2024-03-23)


### ⚠ BREAKING CHANGES

* **sdk:** Refactor public functions to use parameter object ⚙️

### Bug Fixes

* **sdk:** Update README.md ([b79742e](https://github.com/paraspell/xcm-tools/commit/b79742eae39109f7015b05359d25499104456fd3))
* Update SDK README.md ([330323c](https://github.com/paraspell/xcm-tools/commit/330323c7727bd784dbfddb4ab06b1ce4f460871b))


### Miscellaneous Chores

* **sdk:** Monthly check ✨ ([bee15fb](https://github.com/paraspell/xcm-tools/commit/bee15fb231932705bdfcdb14a13770b8f566035d))


### Code Refactoring

* **sdk:** Refactor public functions to use parameter object ⚙️ ([53e81b5](https://github.com/paraspell/xcm-tools/commit/53e81b56523e14e90f5f1ffc0103cb2bd9420c08))

## [4.1.1](https://github.com/paraspell/xcm-tools/compare/sdk-v4.1.0...sdk-v4.1.1) (2024-02-25)


### Bug Fixes

* update docs ([f4d9013](https://github.com/paraspell/xcm-tools/commit/f4d90134d84b1664d86890af26ac25f05163661d))


### Miscellaneous Chores

* Rebrand parachain OriginTrail to NeuroWeb ([6b034de](https://github.com/paraspell/xcm-tools/commit/6b034debf1f4ad37df152a81be9c6ec7c31adbf6))

## [4.1.0](https://github.com/paraspell/xcm-tools/compare/sdk-v4.0.1...sdk-v4.1.0) (2024-02-21)


### Features

* Migrate to a pnpm monorepo 🗂️ ([e8dc883](https://github.com/paraspell/xcm-tools/commit/e8dc883900ab2cc31e293efd205e93478619e572))
