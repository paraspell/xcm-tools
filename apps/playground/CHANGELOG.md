# Changelog

## [14.0.0](https://github.com/paraspell/xcm-tools/compare/playground-v13.1.0...playground-v14.0.0) (2026-04-10)


### ⚠ BREAKING CHANGES

* **swap:** Remove dex suffix to simplify code 🔧
* Deprecate asset claim & remove from playground 🧹
* **swap:** Make swap package generic ⚡️
* **swap:** Remove moved isExchange flag 🧹
* **sdk-core:** Rename TSendOptions to TTransferOptions for clarity ✨
* **sdk-core:** Turn abstract decimals on by default ⚙️
* **sdk-core:** Rename senderAddress -> sender & address -> recipient ✨
* Deprecate hasAssetSupport function 🧹
* **sdk-core:** Merge assets into one array 🧹
* **sdk-core:** Remove foreign & native balance methods 🧹
* Rename `node` to `chain` 👨‍💻
* Remove multi prefix 🪄

### Features

* Add decimal abstraction feature ✨ ([604ab79](https://github.com/paraspell/xcm-tools/commit/604ab795c219f29b2276e5f0e7b644c26f4a281c))
* Add dry run preview 🪄 ([101f25d](https://github.com/paraspell/xcm-tools/commit/101f25da6a4f4fcce9435a948ddeae7b0631cdc5))
* Add full asset info to fee queries 🪄 ([0c56240](https://github.com/paraspell/xcm-tools/commit/0c562408361e1e3d4301799b4a5a140893385451))
* Add support for transact XCM instruction 🪄 ([a855e45](https://github.com/paraspell/xcm-tools/commit/a855e455a9d6cd846b55b315b2f41995a8a04637))
* Add support for Westend, Paseo snowbridge ↔ ([d3954d5](https://github.com/paraspell/xcm-tools/commit/d3954d539a1f5348c140e5e31d955d5e66dad055))
* Add xcm format check using dry-run 👨‍💻 ([0c80198](https://github.com/paraspell/xcm-tools/commit/0c801985aa489f7c233144a39385dc5d0a6f7e70))
* **assets:** Deprecate getAssetId, getAssetDecimals in favor of findAssetInfo 🧹 ([87021d9](https://github.com/paraspell/xcm-tools/commit/87021d92e159375f92d9e3982c43f11c60d8d7f6))
* **assets:** Make findAssetInfo destination optional ✨ ([0617bc8](https://github.com/paraspell/xcm-tools/commit/0617bc8286eeb240cdbe6591b23824c3fb6ea082))
* Deprecate asset claim & remove from playground 🧹 ([2350291](https://github.com/paraspell/xcm-tools/commit/235029187bf3f625f590e90ca802f4a525b863ac))
* Deprecate hasAssetSupport function 🧹 ([551c791](https://github.com/paraspell/xcm-tools/commit/551c7911bad44104622ebebb39d8421e5a83adea))
* Migrate to react-router@v7 ([8112658](https://github.com/paraspell/xcm-tools/commit/8112658b763f4cd53d083d35f23135070522da76))
* **pallets:** Add assets pallet info to pallets.json 🪄 ([66279f1](https://github.com/paraspell/xcm-tools/commit/66279f17765fccfc72b36d4ffd28b4789de88343))
* **playground:** Add a warning alert & modal ⚠️ ([81970b6](https://github.com/paraspell/xcm-tools/commit/81970b631dd4b626ef2fc799015a8afc393c2020))
* **playground:** Add localhost section ✨ ([ba90e98](https://github.com/paraspell/xcm-tools/commit/ba90e98eb0bfb81f66a7a50b40d67e3ae05e7a15))
* **playground:** Add support for router custom currency selection (issue-1365) 🔧 ([#1723](https://github.com/paraspell/xcm-tools/issues/1723)) ([9f82ab9](https://github.com/paraspell/xcm-tools/commit/9f82ab9a24d328d40ed2768eda80e99f1ecd6c8b))
* **playground:** Connect query params to routing 🪄 ([736d177](https://github.com/paraspell/xcm-tools/commit/736d17742980c782001eb083a8f977169c68517f))
* **playground:** Make side menu collapsible ↔ ([8621517](https://github.com/paraspell/xcm-tools/commit/8621517d6478a17881d91d45b02305e92ec55adc))
* **playground:** Remove estimate functions from playground 🧹 ([622b257](https://github.com/paraspell/xcm-tools/commit/622b25743ff545dd0700a1c76186db84e1e2bae3))
* Remove multi prefix 🪄 ([2577fd8](https://github.com/paraspell/xcm-tools/commit/2577fd868dca2a06cca452357dc84385910b9c19))
* Rename `node` to `chain` 👨‍💻 ([ec1a66f](https://github.com/paraspell/xcm-tools/commit/ec1a66fc7d6ee3a68f2072516c2fbfd176dbaa14))
* **sdk-core:** Add getReceivableAmount func to builder 🧱 ([6691a0d](https://github.com/paraspell/xcm-tools/commit/6691a0d294b9df3c4a05e8557ea45d36ff46c0a6))
* **sdk-core:** Add keepAlive flag for local transfers 🪄 ([fcf32ac](https://github.com/paraspell/xcm-tools/commit/fcf32ac00baea19b6304d59a8593c1e0b6f55f17))
* **sdk-core:** Add min transferable amount function 🪄 ([5bf88e1](https://github.com/paraspell/xcm-tools/commit/5bf88e146bd63ef8fc6610efbbffed6fd74fac00))
* **sdk-core:** Add support for ALL amount for local transfers ✨ ([4d06874](https://github.com/paraspell/xcm-tools/commit/4d06874e7365cb55e9522e7b42433118992d7551))
* **sdk-core:** Merge assets into one array 🧹 ([b7ce50b](https://github.com/paraspell/xcm-tools/commit/b7ce50bc3e29f7b6b0c23ab1aec6f3f714117ef6))
* **sdk-core:** Remove foreign & native balance methods 🧹 ([5b34577](https://github.com/paraspell/xcm-tools/commit/5b34577e361504a52dde974b356cd1ef1032c550))
* **sdk-core:** Rename senderAddress -&gt; sender & address -&gt; recipient ✨ ([f31049f](https://github.com/paraspell/xcm-tools/commit/f31049f96d5a6c1fc8ce961b40c4354a778cc496))
* **sdk-core:** Turn abstract decimals on by default ⚙️ ([db85912](https://github.com/paraspell/xcm-tools/commit/db85912f067e8d0fc55621043860bac62e88d21e))
* **sdk-core:** Use dryRun root bypass to always show fees 🪄 ([76fee70](https://github.com/paraspell/xcm-tools/commit/76fee703be840203a97eac07d747221c273257ab))
* **sdk-dedot:** Add support for Dedot 🪄✨ ([928c691](https://github.com/paraspell/xcm-tools/commit/928c691e92c413ddffc7bc3aa67496967939024c))
* **swap:** Make swap package generic ⚡️ ([5f35a8e](https://github.com/paraspell/xcm-tools/commit/5f35a8e43d7874c839bcd7d062e96f5e44d62e3b))
* **swap:** Remove moved isExchange flag 🧹 ([7c7df6f](https://github.com/paraspell/xcm-tools/commit/7c7df6fd16a887bb6003e9ed0516a509248e37ae))
* **xcm-api,playground:** Expose getAssetReserveChain ✨ ([81ecaa9](https://github.com/paraspell/xcm-tools/commit/81ecaa90adc333aae4ed374a0301ffd4c749961c))
* **xcm-router:** Add dryRun function to RouterBuilder 🪄 ([1f14dc9](https://github.com/paraspell/xcm-tools/commit/1f14dc94cb40edce7ade9faf157ddcf6cdbd5925))
* **xcm-router:** Add feeAsset method to router builder ✨ ([489b040](https://github.com/paraspell/xcm-tools/commit/489b0405691e00b5306d8ec031cce1eac392d922))
* **xcm-router:** Add getMinTransferableAmount to RouterBuilder 🪄 ([845a2bf](https://github.com/paraspell/xcm-tools/commit/845a2bf00d683cd73923a023b1da1a0e1130c145))
* **xcm-router:** Add support for apiOverrides ✨ ([12ac6b8](https://github.com/paraspell/xcm-tools/commit/12ac6b8cdea3479fc486535036bb68253eb09238))
* **xcm-router:** Add transferable amount for router ✨ ([575e3d2](https://github.com/paraspell/xcm-tools/commit/575e3d2b858c1ec422d64cb11c3d0a03cf1b7ebb))


### Bug Fixes

* **assets:** Migrate to new Snowbridge asset registry 🪄 ([d36c1b7](https://github.com/paraspell/xcm-tools/commit/d36c1b753836f6cee00b45119e6644c135d442f9))
* Fix Missing receiver address input validation when sending from and to the same Network ([392a634](https://github.com/paraspell/xcm-tools/commit/392a634c8b0f2c09b6c0bfb88e60cad1a9e7ae8e))
* Fix playground errors & Update sdk-core peer deps 🔧 ([#1734](https://github.com/paraspell/xcm-tools/issues/1734)) ([c70077a](https://github.com/paraspell/xcm-tools/commit/c70077acbe5356005706f18881867dba237c08eb))
* Fix sending amount input validation to check negative amounts ([918b339](https://github.com/paraspell/xcm-tools/commit/918b339b485365189e68ff12eeb5e8a3981727ef))
* Fix some XCM v3 transfers not working 🔧 ([536d291](https://github.com/paraspell/xcm-tools/commit/536d291e9820ca22b0febc215ebb80a4b7b8c9fe))
* Improve React eslint rules 🪄 ([b4d19b4](https://github.com/paraspell/xcm-tools/commit/b4d19b438d8b0166788ccbfde8ccb47fdcf0dff8))
* Perform a monthly check ⚙️ ([e5fba54](https://github.com/paraspell/xcm-tools/commit/e5fba54c4b724b716c20f26ae92e7a0f8d9b0524))
* Perform monthly maintenance check ([8854677](https://github.com/paraspell/xcm-tools/commit/88546775fbb5ab4b95ec1a1dde9f0c92d99a5bb5))
* **playground:** Add currency info label 🔧 ([80bad96](https://github.com/paraspell/xcm-tools/commit/80bad96a6367ffed28a50ee4f9acad12d2aea88b))
* **playground:** Fix broken address autofill logic 🔧 ([6c6e2f7](https://github.com/paraspell/xcm-tools/commit/6c6e2f7e8f88ddc9c31e5e538039056b213f7853))
* **playground:** Fix dry run preview XCM API req ⚙️ ([60422b6](https://github.com/paraspell/xcm-tools/commit/60422b600f7d8a723fd9d61394a274c6b205e23e))
* **playground:** Fix keepAlive option transforming 🔧 ([9492b46](https://github.com/paraspell/xcm-tools/commit/9492b4637fdf006203aadf9a9aedff0cb19f4a7d))
* **playground:** Fix mobile view api select 🔧 ([eab9f57](https://github.com/paraspell/xcm-tools/commit/eab9f5733bab99c768de07ca2678d26176ecc823))
* **playground:** Fix unhandled missing currency error 🔧 ([1be52dc](https://github.com/paraspell/xcm-tools/commit/1be52dc6a05bc75c6e75659118cd8960887873d2))
* **playground:** Fix wrong currency selection when API enabled 🛠️ ([cb02afc](https://github.com/paraspell/xcm-tools/commit/cb02afc2104d95f170e6eb53e63b167f9f71baf0))
* **playground:** Fix XCM API format check option 🔧 ([29be14e](https://github.com/paraspell/xcm-tools/commit/29be14e1f52a78269fa10c33b997e9c1102a5aaa))
* **playground:** Improve address validation for XcmUtils form 🛠️ ([59c60c7](https://github.com/paraspell/xcm-tools/commit/59c60c72b7cbdf88c45e5cab74eb2c8706e16206))
* Re-enable execute for Hydration chain ✨ ([f7fe395](https://github.com/paraspell/xcm-tools/commit/f7fe395d39447c85973868f9a22a248c6ce1aecd))
* Refactor location localization & fix bifrost dex issues 🔧 ([0d83ded](https://github.com/paraspell/xcm-tools/commit/0d83ded64dae482ac84986475dd76e4a8f714e82))
* **sdk-core:** Add amount all handling for fee functions ✨ ([ceead0e](https://github.com/paraspell/xcm-tools/commit/ceead0ef919080f18123f6289e1d3b2a7f33663c))
* **sdk-core:** Add SDK level address validation 📕 ([57c6a2c](https://github.com/paraspell/xcm-tools/commit/57c6a2c9aaef9d0e152d6f4f1de1fe668237f9bc))
* **sdk-core:** Fix bridge system asset selection 🔧 ([3305d89](https://github.com/paraspell/xcm-tools/commit/3305d892146a662ef993bab65607074ac3008e2c))
* **sdk-core:** Fix NeuroWebPaseo minting & Update getXcmFee retry logic 🔧 ([fd0b0b8](https://github.com/paraspell/xcm-tools/commit/fd0b0b8437331568eeb35f6747f24d8f2187e3ce))
* **sdk-core:** Fix origin fee asset handling in transfer info 🛠️ ([c1917f7](https://github.com/paraspell/xcm-tools/commit/c1917f74d35e2d68dbb7984b86a2b118c37608cc))
* **sdk-core:** Override bypass amount to fixed value 🔧 ([ae674fd](https://github.com/paraspell/xcm-tools/commit/ae674fd2d686a6f4156ae9da9feeaff83ab3baa3))
* **sdk-core:** Update code to use new generic router builder ✨ ([6c8d8d0](https://github.com/paraspell/xcm-tools/commit/6c8d8d0a4927fdd627ece58bd9a18a1b8a918c7e))
* **sdk-core:** Use TypeAndThen for BILL asset 🔧 ([ad07a47](https://github.com/paraspell/xcm-tools/commit/ad07a47dc59d9298ddc2c364db87c5efd42d078e))
* **sdk:** Add PAPI support for legacy chains 🔧 ([5388409](https://github.com/paraspell/xcm-tools/commit/538840978eb132b36ba78e93c19927d553781d11))
* **sdk:** Fix e2e errors 🔧 ([4619da8](https://github.com/paraspell/xcm-tools/commit/4619da83cf5fdc7ea384b3d6b2decd1d8146f88c))
* **swap:** Add support for exchange empty array ✨ ([#1750](https://github.com/paraspell/xcm-tools/issues/1750)) ([e071e79](https://github.com/paraspell/xcm-tools/commit/e071e7994aef9397db4e8fab89a90fb354b92275))
* **swap:** Create extension registry 🔧 ([335a678](https://github.com/paraspell/xcm-tools/commit/335a67873effef8a82f90e4a8f90bae2c730d1b9))
* **swap:** Handle empty exchange array correctly 🔧 ([b95ce73](https://github.com/paraspell/xcm-tools/commit/b95ce734e33175c69c3f47e4786def51cc6f079a))
* **swap:** Register swap extension in playground 🔧 ([6b45d52](https://github.com/paraspell/xcm-tools/commit/6b45d52069875fba8412c2b7e677426a91bc644c))
* **swap:** Remove unnecessary exports 🔧 ([b5882ef](https://github.com/paraspell/xcm-tools/commit/b5882ef94970a5399bafd340e7c206834ca976ea))
* Update Assets & Add e2e disabled chains filtering ✨ ([465bdac](https://github.com/paraspell/xcm-tools/commit/465bdaccaf2adff5531743786df98af01cefb359))
* Update LICENSES and Sponsor logos ([2e3a881](https://github.com/paraspell/xcm-tools/commit/2e3a881a3d843101bdaf93db945e0a2bb48a7cf3))


### Documentation

* Add Netlify and code of conduct ([8352a01](https://github.com/paraspell/xcm-tools/commit/8352a013d4080a37fcaebf381c817c38b994120c))
* fix playground readme ([b8be127](https://github.com/paraspell/xcm-tools/commit/b8be12780a9147f0783f38757ad02ae6fd313555))
* Remove lightspell naming ([31a5447](https://github.com/paraspell/xcm-tools/commit/31a54477ffad4ba4f278e253b15ae68ee1827b38))
* Update README to remove XCM Router reference ([ac57382](https://github.com/paraspell/xcm-tools/commit/ac573825fed80bcd67de667b0d747c8d52340b08))
* Update readmes to be up to date ([864f206](https://github.com/paraspell/xcm-tools/commit/864f206106c545fbbd68d292139ab3224e474bb2))


### Code Refactoring

* **playground:** Refactor AssetQueries to use CurrencySelection component 👨‍💻 ([68050e9](https://github.com/paraspell/xcm-tools/commit/68050e94842b2d3f8d71bdd4be1d8e2b695fa21d))
* Rename Visualizator to Visualizer ([db002a3](https://github.com/paraspell/xcm-tools/commit/db002a3cfa962dc595dc5caac29dbbd088dd1212))
* **sdk-core:** Rename TSendOptions to TTransferOptions for clarity ✨ ([384453e](https://github.com/paraspell/xcm-tools/commit/384453e8514377184c8c35337bc8940d7340c3a6))
* **swap:** Remove dex suffix to simplify code 🔧 ([3974b18](https://github.com/paraspell/xcm-tools/commit/3974b18a479df51c27c51495db973410aabb60d2))
* **swap:** Store only location references in swap assets map 🔑 ([#1737](https://github.com/paraspell/xcm-tools/issues/1737)) ([c50c83b](https://github.com/paraspell/xcm-tools/commit/c50c83bb8293be87c66fa69d199c416befd601e2))
* Update logic to account for non-null locations 🔧 ([5ce50cd](https://github.com/paraspell/xcm-tools/commit/5ce50cd4bb611483152bf412da6777bdc784b037))


### Tests

* **playground:** Improve Playground E2E tests (issue-413) ([#1471](https://github.com/paraspell/xcm-tools/issues/1471)) ⚙️ ([3cfd63f](https://github.com/paraspell/xcm-tools/commit/3cfd63f9c888abfd72c990226113bccc3c8dbfa8))
* **sdk:** Add dry run bypass E2E tests 🧪 ([36fe5a9](https://github.com/paraspell/xcm-tools/commit/36fe5a9203542334525b34d22d0c8a698ff8cdf3))


### Build System

* Perform a monthly check 🪄 ([e33f659](https://github.com/paraspell/xcm-tools/commit/e33f659683b48702e7b3d3a9fae4b4fa75f09b93))
* Perform a monthly check 🪄 ([6d53c32](https://github.com/paraspell/xcm-tools/commit/6d53c32c3e4e9921053528a148c0687c3249c040))
* Perform a monthly check 🪄 ([0da5837](https://github.com/paraspell/xcm-tools/commit/0da5837c2b424274bf4dfa53afa6dfde5c7e6be6))
* Perform a monthly maintenance check ⚙️ ([87d1246](https://github.com/paraspell/xcm-tools/commit/87d1246a107ccecb97f7106fc16948a1078d6de6))
* Perform a monthly maintenance check ⚙️ ([65d72b0](https://github.com/paraspell/xcm-tools/commit/65d72b032251ba023ff5340fce8d737bb884968a))
* Perform a monthly maintenance check 🔧 ([1d7a4c3](https://github.com/paraspell/xcm-tools/commit/1d7a4c37cbcf94438b29a1c6e2be2874fc49f7db))
* Rename xcm-router package to swap 📦 ([#1728](https://github.com/paraspell/xcm-tools/issues/1728)) ([97e41ed](https://github.com/paraspell/xcm-tools/commit/97e41edd9cc1f46d5a4756fc271b2d020b16ef18))
* Update PAPI version 📦 ([61fc210](https://github.com/paraspell/xcm-tools/commit/61fc210568e1d4f1dff51aad1c6400435892bda7))
* Update to [@mantine](https://github.com/mantine) v9 📦 ([7244055](https://github.com/paraspell/xcm-tools/commit/724405546cf073b875ea401bd2d570a6c54c2d5a))
* Update to TypeScript v6 📦 ([0ecad63](https://github.com/paraspell/xcm-tools/commit/0ecad63ab0c39484572232bd33f7fbc0f3409de2))
* Update viem to v2.45.0 📦 ([124a73a](https://github.com/paraspell/xcm-tools/commit/124a73a1565082ed3eea6ac5af549e7c4aa9db68))
