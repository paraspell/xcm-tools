# Changelog

## [14.1.0-rc](https://github.com/paraspell/xcm-tools/compare/sdk-dedot-v14.0.0...sdk-dedot-v14.1.0-rc) (2026-07-22)


### Miscellaneous Chores

* **sdk-dedot:** Synchronize main versions

## [14.0.0](https://github.com/paraspell/xcm-tools/compare/sdk-dedot-v13.11.0...sdk-dedot-v14.0.0) (2026-07-20)


### ⚠ BREAKING CHANGES

* Unify dry run and XCM fee error fields under dryRunError 🔧
* Remove deprecated asset query functions 🧹
* Remove deprecated location override code 🧹

### Features

* Remove deprecated asset query functions 🧹 ([400d538](https://github.com/paraspell/xcm-tools/commit/400d5380f6e6bb4ed3e62efaaf331ce3f751e2e4))
* Remove deprecated location override code 🧹 ([dfc7f32](https://github.com/paraspell/xcm-tools/commit/dfc7f32738e1aa9eb35cf6d61e304dcb1b8bcf6f))
* **sdk:** Add papi type descriptors and use typed api ✨ ([21c9723](https://github.com/paraspell/xcm-tools/commit/21c972375e913e08a70f4b74ad206edd50bc293a))


### Bug Fixes

* **xcm-api:** Update error handling list 🔧 ([ad015f6](https://github.com/paraspell/xcm-tools/commit/ad015f6dbb215744edba96c69823924101109270))


### Documentation

* Add readme for descriptors package ✨ ([cb1f1ca](https://github.com/paraspell/xcm-tools/commit/cb1f1ca5f64539e81236f2b07153440a39f2e97d))
* Update docs to reflect v14 ✨ ([1b9c70f](https://github.com/paraspell/xcm-tools/commit/1b9c70fa310118fe090e2fbb4de1a479d68547da))


### Code Refactoring

* Remove TSubstrateChain type casts 🔧 ([3d99cb7](https://github.com/paraspell/xcm-tools/commit/3d99cb7f15190a55bba5af789bb192a8e597e333))
* Unify dry run and XCM fee error fields under dryRunError 🔧 ([6b6849b](https://github.com/paraspell/xcm-tools/commit/6b6849b4c214fdcbee230ee6628ad257effc4281))

## [13.11.0](https://github.com/paraspell/xcm-tools/compare/sdk-dedot-v13.10.1...sdk-dedot-v13.11.0) (2026-07-07)


### Features

* **sdk-core:** Add failure instruction field ✨ ([5235aac](https://github.com/paraspell/xcm-tools/commit/5235aacb086f6f93ef8bd189e1ab3134de2cfd5a))


### Code Refactoring

* **sdk-core:** Use api.* instead of impl methods directly ([0a0d2f8](https://github.com/paraspell/xcm-tools/commit/0a0d2f8d4830f97dc31c73ae40069cd9159c5d3b))

## [13.10.1](https://github.com/paraspell/xcm-tools/compare/sdk-dedot-v13.10.0...sdk-dedot-v13.10.1) (2026-07-03)


### Miscellaneous Chores

* **sdk-dedot:** Synchronize main versions

## [13.10.0](https://github.com/paraspell/xcm-tools/compare/sdk-dedot-v13.9.0...sdk-dedot-v13.10.0) (2026-06-30)


### Bug Fixes

* **sdk-core:** Enable native asset teleports to and from AssetHub 🔧 ([a8931b2](https://github.com/paraspell/xcm-tools/commit/a8931b250126a24a9c681f2bbcd2ed225107701e))


### Build System

* Perform a monthly check 🪄 ([a3ae1ed](https://github.com/paraspell/xcm-tools/commit/a3ae1ed6cf634c839a239ff2dc6a562b2b9787f6))

## [13.9.0](https://github.com/paraspell/xcm-tools/compare/sdk-dedot-v13.8.0...sdk-dedot-v13.9.0) (2026-06-22)


### Features

* **sdk:** Expose failing XCM instruction index in dry run results ✨ ([4d46339](https://github.com/paraspell/xcm-tools/commit/4d46339e447c6ce0d3a764f0d8fb4d96d64bfabc))

## [13.8.0](https://github.com/paraspell/xcm-tools/compare/sdk-dedot-v13.7.2...sdk-dedot-v13.8.0) (2026-06-18)


### Code Refactoring

* Update all scripts to use polkadot-api (PAPI) 🪄 ([92499f5](https://github.com/paraspell/xcm-tools/commit/92499f51898cc80d8f81af788536f296d38254da))

## [13.7.2](https://github.com/paraspell/xcm-tools/compare/sdk-dedot-v13.7.1...sdk-dedot-v13.7.2) (2026-06-11)


### Code Refactoring

* **sdk-core:** Make custom chains fully type safe 🔧 ([9447cb6](https://github.com/paraspell/xcm-tools/commit/9447cb6636a8759c39cfea0d7300d41c5a57aefe))

## [13.7.1](https://github.com/paraspell/xcm-tools/compare/sdk-dedot-v13.7.0...sdk-dedot-v13.7.1) (2026-06-08)


### Miscellaneous Chores

* **sdk-dedot:** Synchronize main versions

## [13.7.0](https://github.com/paraspell/xcm-tools/compare/sdk-dedot-v13.6.0...sdk-dedot-v13.7.0) (2026-06-05)


### Bug Fixes

* **sdk-core:** Fix errors when setting custom chain as destination 🔧 ([0fbc1af](https://github.com/paraspell/xcm-tools/commit/0fbc1afea5e1ed7c556438e1a4ea24360abc0dc7))


### Documentation

* Add ed ([a2f0f5c](https://github.com/paraspell/xcm-tools/commit/a2f0f5c105d468603aea3453db5a22be6b61a1d9))

## [13.6.0](https://github.com/paraspell/xcm-tools/compare/sdk-dedot-v13.5.0...sdk-dedot-v13.6.0) (2026-05-31)


### Features

* Support custom chains & Custom assets support in builder config 🪄 ([079dc0e](https://github.com/paraspell/xcm-tools/commit/079dc0e73e5a46d3cfd2c4e34be335171fc67d31))


### Documentation

* Push override feature documentation ([213dfa6](https://github.com/paraspell/xcm-tools/commit/213dfa60a064e6d6c606fa95639212a497e0f4d1))
* Update address to recipient ([32f4520](https://github.com/paraspell/xcm-tools/commit/32f45206e981f0b9c85aa53cff5bd4d13a0c0574))


### Build System

* Perform a monthly check 🪄 ([1edf4c5](https://github.com/paraspell/xcm-tools/commit/1edf4c503ca6bf69118c5677dc44f392c6fca097))

## [13.5.0](https://github.com/paraspell/xcm-tools/compare/sdk-dedot-v13.4.1...sdk-dedot-v13.5.0) (2026-05-13)


### Features

* **swap:** Extend builder methods support 🪄 ([22f893e](https://github.com/paraspell/xcm-tools/commit/22f893ef6cec8f2cbfa1d7124bd71140ab2f3222))


### Bug Fixes

* **sdk-dedot:** Fix transact hex error 🔧 ([d3b0b2b](https://github.com/paraspell/xcm-tools/commit/d3b0b2be7892d734b22ee8128d0ceffb0da07ad0))


### Documentation

* Add swap helper queries ([c40a86a](https://github.com/paraspell/xcm-tools/commit/c40a86a0b032f630a11a40fe1497fb0acc75df46))

## [13.4.1](https://github.com/paraspell/xcm-tools/compare/sdk-dedot-v13.4.0...sdk-dedot-v13.4.1) (2026-04-30)


### Build System

* Perform a monthly check 🪄 ([e0a64a1](https://github.com/paraspell/xcm-tools/commit/e0a64a1513786f3c729d1699788f1a47a7b1ed3c))

## [13.4.0](https://github.com/paraspell/xcm-tools/compare/sdk-dedot-v13.3.0...sdk-dedot-v13.4.0) (2026-04-28)


### Miscellaneous Chores

* **sdk-dedot:** Synchronize main versions

## [13.3.0](https://github.com/paraspell/xcm-tools/compare/sdk-dedot-v13.2.2...sdk-dedot-v13.3.0) (2026-04-28)


### Bug Fixes

* Remove unnecessary type casts 🔧 ([d878270](https://github.com/paraspell/xcm-tools/commit/d87827082ab8180626eff4aa952cac3fb277712a))
* Remove unused cjs build files link 🔧 ([612d3e4](https://github.com/paraspell/xcm-tools/commit/612d3e4a5f38e4168ea85b7d784cab0ae8dd9be2))
* Update transact call param encoding 🔧 ([5c450cb](https://github.com/paraspell/xcm-tools/commit/5c450cb6f4ce1628ab3e5d703a8eb7caa359bc0f))


### Documentation

* Add evm extension docs ([8f46808](https://github.com/paraspell/xcm-tools/commit/8f4680841646b8a1586e96d8416fd0c5550bf68f))
* Update documentation links ([eed2f41](https://github.com/paraspell/xcm-tools/commit/eed2f4131c850d04cd6064a14bac8cb0f8e00bcc))


### Code Refactoring

* **swap:** Make AH exchange generic 🔧 ([a56de67](https://github.com/paraspell/xcm-tools/commit/a56de67238f4df7aadb46cf8d4754adc7c591e79))

## [13.2.2](https://github.com/paraspell/xcm-tools/compare/sdk-dedot-v13.2.1...sdk-dedot-v13.2.2) (2026-04-16)


### Miscellaneous Chores

* **sdk-dedot:** Synchronize main versions

## [13.2.1](https://github.com/paraspell/xcm-tools/compare/sdk-dedot-v13.2.0...sdk-dedot-v13.2.1) (2026-04-16)


### Miscellaneous Chores

* **sdk-dedot:** Synchronize main versions

## [13.2.0](https://github.com/paraspell/xcm-tools/compare/sdk-dedot-v13.1.0...sdk-dedot-v13.2.0) (2026-04-16)


### Bug Fixes

* Fix some XCM v3 transfers not working 🔧 ([536d291](https://github.com/paraspell/xcm-tools/commit/536d291e9820ca22b0febc215ebb80a4b7b8c9fe))


### Documentation

* Remove snyk ([c9385d3](https://github.com/paraspell/xcm-tools/commit/c9385d3c88b72d9fc333a4a6b13cd29d46b804d3))


### Tests

* Add e2e for Dedot & PJS sdks 🧪 ([b4816ba](https://github.com/paraspell/xcm-tools/commit/b4816ba08e42756330fe44b2cac3a9b2c8ae2ee3))


### Build System

* **sdk:** Update to Papi v2 ✨ ([be558c6](https://github.com/paraspell/xcm-tools/commit/be558c69cfbf4e9ec0060f60355007a339645a07))

## [13.1.0](https://github.com/paraspell/xcm-tools/compare/sdk-dedot-v13.0.1...sdk-dedot-v13.1.0) (2026-04-08)


### Miscellaneous Chores

* **sdk-dedot:** Synchronize main versions

## [13.0.1](https://github.com/paraspell/xcm-tools/compare/sdk-dedot-v13.0.0...sdk-dedot-v13.0.1) (2026-04-02)


### Miscellaneous Chores

* **sdk-dedot:** Synchronize main versions

## [13.0.0](https://github.com/paraspell/xcm-tools/compare/sdk-dedot-v12.10.0...sdk-dedot-v13.0.0) (2026-04-02)


### ⚠ BREAKING CHANGES

* **swap:** Remove dex suffix to simplify code 🔧
* **swap:** Make swap package generic ⚡️
* **sdk-core:** Rename TSendOptions to TTransferOptions for clarity ✨
* Remove deprecated fee estimate functions 🧹

### Features

* **assets:** Make findAssetInfo destination optional ✨ ([0617bc8](https://github.com/paraspell/xcm-tools/commit/0617bc8286eeb240cdbe6591b23824c3fb6ea082))
* Remove deprecated fee estimate functions 🧹 ([3d2b422](https://github.com/paraspell/xcm-tools/commit/3d2b422ebac75afb64c86fce87555b7c211406ab))
* **sdk-dedot:** Add support for Dedot 🪄✨ ([928c691](https://github.com/paraspell/xcm-tools/commit/928c691e92c413ddffc7bc3aa67496967939024c))
* **swap:** Make swap package generic ⚡️ ([5f35a8e](https://github.com/paraspell/xcm-tools/commit/5f35a8e43d7874c839bcd7d062e96f5e44d62e3b))


### Bug Fixes

* **sdk-core:** Update code to use new generic router builder ✨ ([6c8d8d0](https://github.com/paraspell/xcm-tools/commit/6c8d8d0a4927fdd627ece58bd9a18a1b8a918c7e))
* **sdk-pjs:** Fix PJS tx decoder 🔧 ([6ee82ef](https://github.com/paraspell/xcm-tools/commit/6ee82efc7c6a22cf77fbd18b0567e88fc9ecb740))
* Update release versions to bump to v13 ([2a23119](https://github.com/paraspell/xcm-tools/commit/2a2311964761da578a7cba05732c80b65bef0ca1))


### Documentation

* Add dedot documentation ([9605794](https://github.com/paraspell/xcm-tools/commit/9605794a00943454c153eb852c05455c80a2a0ba))
* Add v13 documentation ([f0b942a](https://github.com/paraspell/xcm-tools/commit/f0b942ad482ad40a4104787a9ad3a00a8f99b58e))
* Remove asset claim ([7e07d06](https://github.com/paraspell/xcm-tools/commit/7e07d063d48e49d49eee2e911ae0c5a4333dcc63))
* Remove dex suffix in swap ([7e07d06](https://github.com/paraspell/xcm-tools/commit/7e07d063d48e49d49eee2e911ae0c5a4333dcc63))


### Code Refactoring

* **sdk-core:** Rename TSendOptions to TTransferOptions for clarity ✨ ([384453e](https://github.com/paraspell/xcm-tools/commit/384453e8514377184c8c35337bc8940d7340c3a6))
* **swap:** Remove dex suffix to simplify code 🔧 ([3974b18](https://github.com/paraspell/xcm-tools/commit/3974b18a479df51c27c51495db973410aabb60d2))


### Build System

* Perform a monthly check 🪄 ([e33f659](https://github.com/paraspell/xcm-tools/commit/e33f659683b48702e7b3d3a9fae4b4fa75f09b93))
* Update to TypeScript v6 📦 ([0ecad63](https://github.com/paraspell/xcm-tools/commit/0ecad63ab0c39484572232bd33f7fbc0f3409de2))

## [12.9.7](https://github.com/paraspell/xcm-tools/compare/sdk-dedot-v12.9.6...sdk-dedot-v12.9.7) (2026-03-31)


### Miscellaneous Chores

* **sdk-dedot:** Synchronize main versions

## [12.9.6](https://github.com/paraspell/xcm-tools/compare/sdk-dedot-v12.9.5...sdk-dedot-v12.9.6) (2026-03-31)


### Build System

* Perform a monthly check 🪄 ([e33f659](https://github.com/paraspell/xcm-tools/commit/e33f659683b48702e7b3d3a9fae4b4fa75f09b93))

## [12.9.5](https://github.com/paraspell/xcm-tools/compare/sdk-dedot-v12.9.4...sdk-dedot-v12.9.5) (2026-03-26)


### Miscellaneous Chores

* **sdk-dedot:** Synchronize main versions

## [12.9.4](https://github.com/paraspell/xcm-tools/compare/sdk-dedot-v12.9.3...sdk-dedot-v12.9.4) (2026-03-26)


### Miscellaneous Chores

* **sdk-dedot:** Synchronize main versions

## [12.9.3](https://github.com/paraspell/xcm-tools/compare/sdk-dedot-v12.9.2...sdk-dedot-v12.9.3) (2026-03-25)


### Miscellaneous Chores

* **sdk-dedot:** Synchronize main versions

## [12.9.2](https://github.com/paraspell/xcm-tools/compare/sdk-dedot-v12.9.1...sdk-dedot-v12.9.2) (2026-03-25)


### Miscellaneous Chores

* **sdk-dedot:** Synchronize main versions

## [12.9.1](https://github.com/paraspell/xcm-tools/compare/sdk-dedot-v12.9.0...sdk-dedot-v12.9.1) (2026-03-17)


### Miscellaneous Chores

* **sdk-dedot:** Synchronize main versions

## [12.9.0](https://github.com/paraspell/xcm-tools/compare/sdk-dedot-v12.8.9...sdk-dedot-v12.9.0) (2026-03-17)


### Features

* **sdk-dedot:** Add support for Dedot 🪄✨ ([928c691](https://github.com/paraspell/xcm-tools/commit/928c691e92c413ddffc7bc3aa67496967939024c))


### Documentation

* Add dedot documentation ([9605794](https://github.com/paraspell/xcm-tools/commit/9605794a00943454c153eb852c05455c80a2a0ba))
