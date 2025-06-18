# Changelog

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
