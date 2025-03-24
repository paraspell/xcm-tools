:robot: I have created a release *beep* *boop*
---


<details><summary>sdk-core: 9.0.0</summary>

## [9.0.0](https://github.com/paraspell/xcm-tools/compare/sdk-core-v8.9.1...sdk-core-v9.0.0) (2025-03-24)


###   BREAKING CHANGES

* Split SDK into separate packages for PJS and PAPI (

### Features

* Add eth fee function & new transfers ( ([0ec3c78](https://github.com/paraspell/xcm-tools/commit/0ec3c78e449c58640b4f439eeb5a32b332d70e92))
* Add support for new Snowbridge routes ( ([cd87b23](https://github.com/paraspell/xcm-tools/commit/cd87b23193c0fd84d09e33e0892e97c6646fedc4))
* **playground:** Improve playground ( ([441fa6f](https://github.com/paraspell/xcm-tools/commit/441fa6fb197f2b8f35f34c14fd8f94dcdc15635d))
* **sdk-core:** Add builder method for api disconnecting & Update docs ([5771425](https://github.com/paraspell/xcm-tools/commit/5771425b5c33ae788c03171d5c27c755a9add1d1))
* **sdk-core:** Add function for querying dry-run support >„ ([a6d3b8d](https://github.com/paraspell/xcm-tools/commit/a6d3b8d30acfb9af0d77788243da8813ca4d662c))
* **sdk-core:** Add support for additional &lt;&gt;Polimec transfers >„ ([600e0e6](https://github.com/paraspell/xcm-tools/commit/600e0e6935bcac72d98b92b0c68b2a92669934e4))
* **sdk-core:** Add support for additional &lt;&gt;Polimec transfers >„ ([7cb2768](https://github.com/paraspell/xcm-tools/commit/7cb27684676642704314922c12a8347576da6d0f))
* **sdk-core:** Add support for pallet/method override ( ([aa11c6b](https://github.com/paraspell/xcm-tools/commit/aa11c6b0b8484b7566d76b6d2c6bf1821b840b6d))
* **sdk-core:** Add support for PolkadotXCM execute transfers ( ([7387c96](https://github.com/paraspell/xcm-tools/commit/7387c96ab45dbc4e20cfa8254f808c5d621504b7))
* **sdk-core:** Add support for PolkadotXCM execute transfers ( ([3fee6ac](https://github.com/paraspell/xcm-tools/commit/3fee6ac6f45808758ebcbf1fedddbd3e825bcbd2))
* **sdk:** Add getAssetMultiLocation function ( ([60161ab](https://github.com/paraspell/xcm-tools/commit/60161ab4fa668d9d658665ba54e449a31f2406ce))
* Split SDK into separate packages for PJS and PAPI ( ([ff465e9](https://github.com/paraspell/xcm-tools/commit/ff465e92e57640f525c7d350afec0b9dcf364453))
* **xcm-router:** Add support for AssetHub DEX ( ([274ad41](https://github.com/paraspell/xcm-tools/commit/274ad41d8e7f70f327d2918a8d2fd0aca5374101))
* **xcm-router:** Add support for precise exchange auto-select ( ([ee018a3](https://github.com/paraspell/xcm-tools/commit/ee018a38f72cba5b8e20b4f7d537a6ad4027f92a))
* **xcm-router:** Add support for precise exchange auto-select ( ([18d65d8](https://github.com/paraspell/xcm-tools/commit/18d65d8dead2ef68c71e956a41ea0b1dcca3993b))


### Bug Fixes

* Add missing assets ( ([d33347c](https://github.com/paraspell/xcm-tools/commit/d33347c7cd3b279239c9d7c7dbf7511f6424937f))
* Add PAPI support for Moonbeam -&gt; Ethereum transfer ( ([84b80c3](https://github.com/paraspell/xcm-tools/commit/84b80c3539106313b6cfa90279f1eee249ecabdd))
* Enable support for bigint literals ( ([0090106](https://github.com/paraspell/xcm-tools/commit/0090106babe2dcecf66d4eaa532d3963a230958b))
* Fix assets export =à ([cdf1d03](https://github.com/paraspell/xcm-tools/commit/cdf1d03a90e11c9f15a76c6fd77475f89e71d536))
* Fix batch transfers for PAPI & Improve playground symbol selection ( ([e6f38b1](https://github.com/paraspell/xcm-tools/commit/e6f38b17bdb7dd9cdc6d898485c7ba2a2ed8e191))
* Fix ESlint errors & Update Snowbridge SDK ([9049acc](https://github.com/paraspell/xcm-tools/commit/9049acc68991a89174199cb799f4d3a9756cf855))
* Fix package json warnings =' ([de6ea5d](https://github.com/paraspell/xcm-tools/commit/de6ea5df89513753b7a83e4053121a4b207a97c5))
* Improve EVM builder ( ([76afbf3](https://github.com/paraspell/xcm-tools/commit/76afbf3505460fbe85d4a91190a45e14cd8f2491))
* **playground:** Improve mobile responsivity=ñ ([ecdf91b](https://github.com/paraspell/xcm-tools/commit/ecdf91b14882b72b637f800cd76d08f1ecf8f6aa))
* Remove ahAddress field in favor of senderAddress & Router fixes =' ([9c2680a](https://github.com/paraspell/xcm-tools/commit/9c2680afe64caec8b7e91b2e1a584cf8e527eb8e))
* **sdk-core:** Accept public key address =Ç ([46ed82d](https://github.com/paraspell/xcm-tools/commit/46ed82d6c140b2a02d5449e10b2d3df0a49f10cd))
* **sdk-core:** Add complete multi-locations for AH assets ([8d5e2ce](https://github.com/paraspell/xcm-tools/commit/8d5e2ce855f9becd5afb446d88e36111ec8bf47f))
* **sdk-core:** Add multi-locations to native assets ([8e40da1](https://github.com/paraspell/xcm-tools/commit/8e40da1450722e37de7cf0365a806e424b58c453))
* **sdk-core:** Fix AH -&gt; system chains transfers =' ([e65d436](https://github.com/paraspell/xcm-tools/commit/e65d436721c02cf4cb32b2444906d1cf00b2bb5d))
* **sdk-core:** Fix AssetHub fee calculation =à ([971db0d](https://github.com/paraspell/xcm-tools/commit/971db0d92453d11bc7bba5398e833cee6f51d98b))
* **sdk-core:** Fix dry run =' ([7864be5](https://github.com/paraspell/xcm-tools/commit/7864be50ff1de8a398920e44a6d4eb2bcbc217a7))
* **sdk-core:** Fix failing e2e tests >ê ([5c8785b](https://github.com/paraspell/xcm-tools/commit/5c8785bbd3cb675826fc6f0a31cd8230e86811a3))
* **sdk-core:** Fix failing e2e tests >ê ([3b2d097](https://github.com/paraspell/xcm-tools/commit/3b2d0973958eee78e5f802300cb5c57ab8ec8188))
* **sdk-core:** Fix incorrect type for getOriginFee function =' ([7bd0128](https://github.com/paraspell/xcm-tools/commit/7bd01286ada88028ca5567233b5b82c3a306e5d6))
* **sdk-core:** Fix Polimec foreign assets fetching >™ ([00ebcc5](https://github.com/paraspell/xcm-tools/commit/00ebcc52edfaba51a848b38fffd3f1f37ab457c5))
* **sdk-core:** Fix Polimec foreign assets fetching >™ ([d5530bb](https://github.com/paraspell/xcm-tools/commit/d5530bb21278355c7c77eae15e4f5b68d2452baf))
* **sdk-core:** Fix Polkadot -&gt; Polimec transfer =' ([2c508a4](https://github.com/paraspell/xcm-tools/commit/2c508a44ad6f92be2427d3fbcb84bcfbcfc6a448))
* **sdk-core:** Fix Polkadot -&gt; Polimec transfer =' ([ef5ac26](https://github.com/paraspell/xcm-tools/commit/ef5ac263afdc6d6418ab495a9f09449ba994f014))
* **sdk-core:** Randomize multiple ws providers for Hydration =' ([78242e9](https://github.com/paraspell/xcm-tools/commit/78242e9632182694ce46331b26653e97fb61dd59))
* **sdk-core:** Remove Hydration non RPC compliant endpoint >ù ([c9af914](https://github.com/paraspell/xcm-tools/commit/c9af91438de7e01207d867172b8a56fb112f4397))
* **sdk-core:** Remove keep alive feature =' ([5d7761e](https://github.com/paraspell/xcm-tools/commit/5d7761ede0c87e7b6c00e4d1f416323409211870))
* **sdk-core:** Update folder structure =Á ([a233074](https://github.com/paraspell/xcm-tools/commit/a233074e2f096e7e9d2194c7142bd7bac877bfc7))
* **sdk-core:** Validate sender address in dry-run function =à ([f71efde](https://github.com/paraspell/xcm-tools/commit/f71efde6c1419bf15f5e9b8775d901483d410731))
* **sdk-pjs:** Fix Snowbridge transfers not working for some wallets =' ([b846b70](https://github.com/paraspell/xcm-tools/commit/b846b708e90675b3e47c3da1b2142a1ef2528f0a))
* Update Rollup TypeScript plugin to official version  ([20c0f25](https://github.com/paraspell/xcm-tools/commit/20c0f25224a86b859ac1ad043c5cf04febdf743e))
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
* Perform monthly check =' ([fdcb194](https://github.com/paraspell/xcm-tools/commit/fdcb194681947b4e92ff8b34ebd7b3c84e6d0048))
* Perform monthly check =' ([b459bc4](https://github.com/paraspell/xcm-tools/commit/b459bc48044711b02e3ed1bf0ea1d9ddecd32098))
* Perform monthly maintenance check  =h=' ([a85c3bd](https://github.com/paraspell/xcm-tools/commit/a85c3bd427b6d1d829155bf32a4524637eb78a1f))
* **xcm-tools:** Update readme ([c10bdbb](https://github.com/paraspell/xcm-tools/commit/c10bdbb8ce16b5e8700c30f8b82d1912f604b966))


### Code Refactoring

* Change multi-location type ( ([997e605](https://github.com/paraspell/xcm-tools/commit/997e605a1f5816ac44f4a18ee90859a677c55141))
* Create separate packages for assets and common code ( ([d1ed352](https://github.com/paraspell/xcm-tools/commit/d1ed3523e86219916e810fffa06e53b2a3ef96ea))
* Create separate packages for assets and common code e ( ([371b3ec](https://github.com/paraspell/xcm-tools/commit/371b3ec72558e2177c6d7129871820ad50a02a4e))
* Create separate pallets package =æ ([62fa967](https://github.com/paraspell/xcm-tools/commit/62fa96753698ed2d5d5d21492c7d2447ad613006))
* Improve builder type safety =' ([41389de](https://github.com/paraspell/xcm-tools/commit/41389dee44246fc83d46f45512f97433fd773b50))
* **playground:** Use automatic api creation ( ([0caa420](https://github.com/paraspell/xcm-tools/commit/0caa4204fc35970c4461df975510f01246556a1d))
* **sdk-core:** Improve currency related types >› ([aad04ba](https://github.com/paraspell/xcm-tools/commit/aad04ba0854a8fd25aa1f7828bb4fe172b8635a4))
* **sdk-core:** Refactor beneficiary multi-location creation =' ([d96e518](https://github.com/paraspell/xcm-tools/commit/d96e5186d243fa560138342fd9bdb4f7328bf156))
* **sdk-core:** Refactor beneficiary multi-location creation =' ([bde4031](https://github.com/paraspell/xcm-tools/commit/bde4031ff28d90139da1557f9244b4833ceae817))
* **sdk-core:** Refactor override currency logic =' ([6f4f636](https://github.com/paraspell/xcm-tools/commit/6f4f63685402907efb18b6346ce4c189773d219f))
* **sdk-core:** Refactor override currency logic =' ([905e9c5](https://github.com/paraspell/xcm-tools/commit/905e9c5355fd7e0f1e8defbef34d4247e6b39f9d))
* **sdk-core:** Refactor parachainId resolving =' ([425a1b3](https://github.com/paraspell/xcm-tools/commit/425a1b3a21de29269b74e472f19efd32e0e9eff9))
* **xcm-api:** Use automatic api creating ( ([3e840b1](https://github.com/paraspell/xcm-tools/commit/3e840b1ab1d141c97bfd6322d83a62d4199d9305))
* **xcm-router:** Improve asset selection and validation >„ ([138f633](https://github.com/paraspell/xcm-tools/commit/138f633fbe3e2de851dd70be305e792208350320))


### Tests

* Refactor and improve SDK e2e tests >ê ([7220d0d](https://github.com/paraspell/xcm-tools/commit/7220d0dc529ab7e08a35cc3cb2e87e5569634792))
* **sdk-core:** Add assets E2E tests >ê ([e3dee4e](https://github.com/paraspell/xcm-tools/commit/e3dee4edd4d80cb4a806ed711862e5b9e3bb862e))


### Build System

* Add sort-imports ESlint rule ( ([d9bd402](https://github.com/paraspell/xcm-tools/commit/d9bd4024ba87f6c8fedad012100ea76fdf7658c8))
* **xcm-router:** Update Bifrost DEX SDK =æ ([fe85f27](https://github.com/paraspell/xcm-tools/commit/fe85f273c6371c27a97e86c57d59b8913f5bff68))
</details>

<details><summary>sdk: 9.0.0</summary>

## [9.0.0](https://github.com/paraspell/xcm-tools/compare/sdk-v8.9.1...sdk-v9.0.0) (2025-03-24)


###   BREAKING CHANGES

* Split SDK into separate packages for PJS and PAPI (
* **sdk:** Refactor transfer Builder to explicitly include from, to parameters for relaychains
* **sdk:** Add PolkadotAPI(PAPI) support (
* **sdk:** Refactor asset selection =à

### Features

* Add eth fee function & new transfers ( ([0ec3c78](https://github.com/paraspell/xcm-tools/commit/0ec3c78e449c58640b4f439eeb5a32b332d70e92))
* Add ParaSpell landing page ([91ceeba](https://github.com/paraspell/xcm-tools/commit/91ceeba999473cd618edae70f028f5e2bdfd25d9))
* Add playground "use API" option to transfer-info & asset claim ([8d9bbcb](https://github.com/paraspell/xcm-tools/commit/8d9bbcb602de89fee28def064bf9d765a711c7e5))
* Add Select component for selecting assets ([850483f](https://github.com/paraspell/xcm-tools/commit/850483fc75dbef266b46a5bbb15da8517985c620))
* Add support for asset claim =' ([b02f8ed](https://github.com/paraspell/xcm-tools/commit/b02f8ed5af5a78598cca2af1e16ddb5c4a55ea4b))
* Add support for Curio chain ([f1197c5](https://github.com/paraspell/xcm-tools/commit/f1197c55b3c048a42533933bfca2b52cfa33be91))
* Add support for overriding multi assets ([e35e521](https://github.com/paraspell/xcm-tools/commit/e35e521dde4f12adf4d03da9ab07476bdbee455e))
* Add support for Polkadot and Kusama bridge ([0b935fe](https://github.com/paraspell/xcm-tools/commit/0b935fecf6e49e7e58abb1efee239bce53126a0b))
* Add support for querying balances for parachains ([c236def](https://github.com/paraspell/xcm-tools/commit/c236def6abec0f484febc247a62ac86f2b429241))
* Add support for Snowbridge transfers (Ethereum -&gt; Polkadot) D ([2f16524](https://github.com/paraspell/xcm-tools/commit/2f165245137766d4d11cc5f8a592082f68fc4ff8))
* Add support for Snowbridge transfers (Polkadot -&gt; Ethereum) D ([631cd55](https://github.com/paraspell/xcm-tools/commit/631cd5562a9efdde991276daafc16fc72b635287))
* Add support for V4 MultiAsset ([3d6c68b](https://github.com/paraspell/xcm-tools/commit/3d6c68b9b146aa0d42210e84b0f332c3bf60c0aa))
* **playground:** Add E2E tests using Playwright >ê ([ebb5ad2](https://github.com/paraspell/xcm-tools/commit/ebb5ad21a399abed42dcea7be2fff678acea8f21))
* **playground:** Add support for multi-assets to playground =Ý ([132f475](https://github.com/paraspell/xcm-tools/commit/132f4753e49f89f479cd29043b67917ad9993755))
* Remove HRMP channel functionality ([d7b4f0d](https://github.com/paraspell/xcm-tools/commit/d7b4f0d3d8303e64debb39efcca355ceee80412d))
* **sdk-core:** Add builder method for api disconnecting & Update docs ([5771425](https://github.com/paraspell/xcm-tools/commit/5771425b5c33ae788c03171d5c27c755a9add1d1))
* **sdk-core:** Add support for pallet/method override ( ([aa11c6b](https://github.com/paraspell/xcm-tools/commit/aa11c6b0b8484b7566d76b6d2c6bf1821b840b6d))
* **sdk-core:** Add support for PolkadotXCM execute transfers ( ([7387c96](https://github.com/paraspell/xcm-tools/commit/7387c96ab45dbc4e20cfa8254f808c5d621504b7))
* **sdk-core:** Add support for PolkadotXCM execute transfers ( ([3fee6ac](https://github.com/paraspell/xcm-tools/commit/3fee6ac6f45808758ebcbf1fedddbd3e825bcbd2))
* **sdk:** Add ability to override XCM version ( ([3a5459c](https://github.com/paraspell/xcm-tools/commit/3a5459c2b54535e98db82d86bd11a4a3e7d9b329))
* **sdk:** Add asset search by multi-location ( ([54d0d46](https://github.com/paraspell/xcm-tools/commit/54d0d46d96e4b17b315856a61563a13209fef026))
* **sdk:** Add Coretime Polkadot parachain ( ([8e6510e](https://github.com/paraspell/xcm-tools/commit/8e6510e574d021a1b0ac0a3b878e575a86823c1e))
* **sdk:** Add dry run support ( ([b544a7f](https://github.com/paraspell/xcm-tools/commit/b544a7f58951f2e4830147641b80c1bfe24fc0bb))
* **sdk:** Add fail-safe support ( ([18b1328](https://github.com/paraspell/xcm-tools/commit/18b1328ba3f079d03adebc67ba2d15634d115055))
* **sdk:** Add foreignAssets pallet multi-location checks ([eb2f190](https://github.com/paraspell/xcm-tools/commit/eb2f190c9f270f6a8117229c8fbf58e33409f160))
* **sdk:** Add MultiLocation override feature Ó ([eb6cdbe](https://github.com/paraspell/xcm-tools/commit/eb6cdbedd8bdfb2570e0bc94192afe6079a20b11))
* **sdk:** Add PolkadotAPI(PAPI) support ( ([b3a1e72](https://github.com/paraspell/xcm-tools/commit/b3a1e72f11d13b7f43f077bb2f68cb27903cc7cc))
* **sdk:** Add support for abstracted assets selection ( ([b5ffed8](https://github.com/paraspell/xcm-tools/commit/b5ffed8958aa5680a5ffc9308f0f7f0dd1c1d727))
* **sdk:** Add support for AHP -&gt; MYTHOS transfers =à ([c29c630](https://github.com/paraspell/xcm-tools/commit/c29c630689916c763f0ed88c2bc5879348ce405f))
* **sdk:** Add support for batch utility to Builder ( ([4163a52](https://github.com/paraspell/xcm-tools/commit/4163a52a5c84a7409e045467c68ed49435eb01e5))
* **sdk:** Add support for Moonbeam EVM transfers ( ([d30ba8e](https://github.com/paraspell/xcm-tools/commit/d30ba8e941c9f0835b35d9887339e88e9f1986e8))
* **sdk:** Add support to Hydration &gt; Ethereum transfer >„ ([b6f4c81](https://github.com/paraspell/xcm-tools/commit/b6f4c818bf53d3a0ed080a6f1d7959a08cb97556))
* **sdk:** Allow fee asset customization ™ ([a42be92](https://github.com/paraspell/xcm-tools/commit/a42be924a70faf323b59de24c528e2294408c1a2))
* **sdk:** Allow to pass RPC url to create API client ( ([6fb3af9](https://github.com/paraspell/xcm-tools/commit/6fb3af9cbc58921189ce7c6cdceabb10d5271dcd))
* **sdk:** Enable direct entry of asset symbol or ID as currency ( ([987be79](https://github.com/paraspell/xcm-tools/commit/987be79ddd7198f541654cd8c5353c714f3caf37))
* **sdk:** Refactor asset selection =à ([5e54a11](https://github.com/paraspell/xcm-tools/commit/5e54a11086383699e4f2096e36610c96cc476306))
* **sdk:** Refactor transfer Builder to explicitly include from, to parameters for relaychains ([395b45e](https://github.com/paraspell/xcm-tools/commit/395b45e2d1bfe68c84cea7d19b44e16f2a3b4cd8))
* Split SDK into separate packages for PJS and PAPI ( ([ff465e9](https://github.com/paraspell/xcm-tools/commit/ff465e92e57640f525c7d350afec0b9dcf364453))
* update TransferInfo ([931c4e0](https://github.com/paraspell/xcm-tools/commit/931c4e0f1f789f204a5b8950295a95e7b29c4499))
* **xcm-api:** Add balance queries to XCM-API =h=' ([4475ea7](https://github.com/paraspell/xcm-tools/commit/4475ea721765638fd4d69681e9613bfd6023a3a7))
* **xcm-api:** Add support for directly returning hex of extrinsics ( ([566fac3](https://github.com/paraspell/xcm-tools/commit/566fac3541d05184f1776afeb49ae5148b32f778))
* **xcm-api:** Add support for new currency input types ( ([5d8655a](https://github.com/paraspell/xcm-tools/commit/5d8655a50e26b9c2ca110acfb2caa187e889d581))
* **xcm-api:** Add support for XCM Router API Snowbridge transfers ([c468a80](https://github.com/paraspell/xcm-tools/commit/c468a804845fa3fd78649f01af7eee32a7305aae))
* **xcm-router:** Add support for AssetHub DEX ( ([274ad41](https://github.com/paraspell/xcm-tools/commit/274ad41d8e7f70f327d2918a8d2fd0aca5374101))
* **xcm-router:** Add support for EVM signer ([569f4fc](https://github.com/paraspell/xcm-tools/commit/569f4fc3e0316df4ac82a1b4f3714a7528548c14))
* **xcm-router:** Add support for precise exchange auto-select ( ([ee018a3](https://github.com/paraspell/xcm-tools/commit/ee018a38f72cba5b8e20b4f7d537a6ad4027f92a))
* **xcm-router:** Refactor currency inputs ( ([28db4a9](https://github.com/paraspell/xcm-tools/commit/28db4a918f896f496a5b8c984d9f0413d6f827ae))


### Bug Fixes

* Add destination address checks ([f072da7](https://github.com/paraspell/xcm-tools/commit/f072da7c032ed9fb871191f4975115e779608ed0))
* Add PAPI support for Moonbeam -&gt; Ethereum transfer ( ([84b80c3](https://github.com/paraspell/xcm-tools/commit/84b80c3539106313b6cfa90279f1eee249ecabdd))
* Enable support for bigint literals ( ([0090106](https://github.com/paraspell/xcm-tools/commit/0090106babe2dcecf66d4eaa532d3963a230958b))
* Fix assets export =à ([cdf1d03](https://github.com/paraspell/xcm-tools/commit/cdf1d03a90e11c9f15a76c6fd77475f89e71d536))
* Fix batch transfers for PAPI & Improve playground symbol selection ( ([e6f38b1](https://github.com/paraspell/xcm-tools/commit/e6f38b17bdb7dd9cdc6d898485c7ba2a2ed8e191))
* Fix Evm Moonbeam transfer for PAPI =' ([1e29cfa](https://github.com/paraspell/xcm-tools/commit/1e29cfa93308dceacd35ba5ca17f6e2d2d7b6288))
* Fix ignored ESlint errors =' ([495fc06](https://github.com/paraspell/xcm-tools/commit/495fc067758db128df1d0c46c1c2534dc28aaf3f))
* Fix maps JSON print width ([a98814b](https://github.com/paraspell/xcm-tools/commit/a98814b801365a729bc89d101cd73a84619c25ff))
* Fix package json warnings =' ([de6ea5d](https://github.com/paraspell/xcm-tools/commit/de6ea5df89513753b7a83e4053121a4b207a97c5))
* Fix WS endpoints timing out ([32f34b8](https://github.com/paraspell/xcm-tools/commit/32f34b8eecaf46be06b968bbd97b817860dd8e52))
* Improve EVM builder ( ([76afbf3](https://github.com/paraspell/xcm-tools/commit/76afbf3505460fbe85d4a91190a45e14cd8f2491))
* **playground:** Improve mobile responsivity=ñ ([ecdf91b](https://github.com/paraspell/xcm-tools/commit/ecdf91b14882b72b637f800cd76d08f1ecf8f6aa))
* **playground:** Remove Ethereum option from some selects ( ([825702e](https://github.com/paraspell/xcm-tools/commit/825702e55f2cfab2d52f0c3c6bfcab7904b285a5))
* Remove ahAddress field in favor of senderAddress & Router fixes =' ([9c2680a](https://github.com/paraspell/xcm-tools/commit/9c2680afe64caec8b7e91b2e1a584cf8e527eb8e))
* **sdk-core:** Accept public key address =Ç ([46ed82d](https://github.com/paraspell/xcm-tools/commit/46ed82d6c140b2a02d5449e10b2d3df0a49f10cd))
* **sdk-core:** Add multi-locations to native assets ([8e40da1](https://github.com/paraspell/xcm-tools/commit/8e40da1450722e37de7cf0365a806e424b58c453))
* **sdk-core:** Fix dry run =' ([7864be5](https://github.com/paraspell/xcm-tools/commit/7864be50ff1de8a398920e44a6d4eb2bcbc217a7))
* **sdk-core:** Remove keep alive feature =' ([5d7761e](https://github.com/paraspell/xcm-tools/commit/5d7761ede0c87e7b6c00e4d1f416323409211870))
* **sdk:** Add existential deposits for foreign assets ( ([0c9b2bf](https://github.com/paraspell/xcm-tools/commit/0c9b2bfbb5bdc7309b74af21c7dfcef35aac2967))
* **sdk:** Add relaychain support for getTNode function ™ ([c8fdf3e](https://github.com/paraspell/xcm-tools/commit/c8fdf3eec9c3feddec8cbcc65ad566ba1d8a8f40))
* **sdk:** Add support for AHP &gt; BifrostPolkadot transfer =' ([8a5823b](https://github.com/paraspell/xcm-tools/commit/8a5823be4faa8963a833864f761ae765bfb4485d))
* **sdk:** Export getOriginFeeDetails function =æ ([41fe7a0](https://github.com/paraspell/xcm-tools/commit/41fe7a06e25f9b4b4e5083139c8f5e8aec212257))
* **sdk:** Fix and improve getAssetBalance function =' ([395dc7c](https://github.com/paraspell/xcm-tools/commit/395dc7c4e5b0727ea9d8b25eeb82c67d43b41509))
* **sdk:** Fix asset checks relaychain symbol validation =à ([bc498ac](https://github.com/paraspell/xcm-tools/commit/bc498ace69ba6b76810cb2aa95969d2027ddfddc))
* **sdk:** Fix AssetHub transfer issues =' ([412c9ab](https://github.com/paraspell/xcm-tools/commit/412c9ab6f595ee6729167d8f4868784ed11c8031))
* **sdk:** Fix Astar and Shiden native asset transfers >² ([da13fd2](https://github.com/paraspell/xcm-tools/commit/da13fd287fa6efa4e071bf564b06acaf1050d6d9))
* **sdk:** Fix Bifrost balance fetching =' ([50455ef](https://github.com/paraspell/xcm-tools/commit/50455ef9e72a25fbfc820583e11d7b05651228a0))
* **sdk:** Fix Bifrost transfers =à ([9eb6a2b](https://github.com/paraspell/xcm-tools/commit/9eb6a2bc88d471b56d26d3c99c3b1df3bd15c66e))
* **sdk:** Fix Centrifuge balance query =' ([f780996](https://github.com/paraspell/xcm-tools/commit/f78099684042d4b2427cc258a7c62464d2d1e897))
* **sdk:** Fix Dry run call for relaychains =à ([4c9a35d](https://github.com/paraspell/xcm-tools/commit/4c9a35d68fba5734337f9b490fc2384a18521dbe))
* **sdk:** Fix getOriginFeeDetails API disconnect =à ([346ecd0](https://github.com/paraspell/xcm-tools/commit/346ecd0c953f861850290da8ca1494f643388a48))
* **sdk:** Fix Hydration &lt;&gt; AHP transfers =' ([8f5965d](https://github.com/paraspell/xcm-tools/commit/8f5965db50c12e2b46e550d7c9c0cffe0237516e))
* **sdk:** Fix incomplete Assethub asset symbols =' ([f03aa32](https://github.com/paraspell/xcm-tools/commit/f03aa32e243051e9caf3474884863e737bc7030e))
* **sdk:** Fix Moonbeam 'xc' prefix handling =' ([a986bf8](https://github.com/paraspell/xcm-tools/commit/a986bf886f977499057a5ed49cb078953b770330))
* **sdk:** Fix Moonbeam & Moonriver transfer =' ([f5343f3](https://github.com/paraspell/xcm-tools/commit/f5343f354de1a2568c363facbff455db4a1dfb42))
* **sdk:** Fix Moonbeam balance querying =à ([83360eb](https://github.com/paraspell/xcm-tools/commit/83360ebb1daf62ace1ce3bd52aeb25671c534528))
* **sdk:** Fix Moonbeam foreign assets =' ([cf046df](https://github.com/paraspell/xcm-tools/commit/cf046dffb8687d4c3ed5c70a60cc55eccdfbb945))
* **sdk:** Fix Mythos transfer & assets ([d46f739](https://github.com/paraspell/xcm-tools/commit/d46f7394f7cc686448dd556b5655ee991f891c2a))
* **sdk:** Fix PAPI client automatic disconnect =' ([f858e03](https://github.com/paraspell/xcm-tools/commit/f858e0390cb50964b64b6b84f0ccf1ab30c58185))
* **sdk:** Fix Snowbridge asset selection ( ([8a2709f](https://github.com/paraspell/xcm-tools/commit/8a2709fdfbff7a94a42a7cfebebd0b5f57cac7d0))
* **sdk:** Fix transfer from Polimec to AHP =' ([c2b116c](https://github.com/paraspell/xcm-tools/commit/c2b116c4bd6250c3a58cf2c587543b8c9d93ccc1))
* **sdk:** Fix transfer info invalid currency error handling =à ([139bcfc](https://github.com/paraspell/xcm-tools/commit/139bcfcddc487216c6cc4992bfb168b017e676c6))
* **sdk:** Fix USDT transfer from Bifrost to AssetHub  ([68eb167](https://github.com/paraspell/xcm-tools/commit/68eb16742e8d187de78d8d86d28ed5296be4ccc9))
* **sdk:** Properly disconnect auto-created API client  ([50735d5](https://github.com/paraspell/xcm-tools/commit/50735d59188c093de293836329bed474cd4c815b))
* **sdk:** Remove @polkadot/apps-config depencency ([8a5bbc7](https://github.com/paraspell/xcm-tools/commit/8a5bbc7e5f31ec928e4be2714a69f666fd706fd1))
* **sdk:** Repair decimals ([19acd63](https://github.com/paraspell/xcm-tools/commit/19acd63908202c1978377079c2370b8708c758f4))
* **sdk:** Repair formatter ([172050b](https://github.com/paraspell/xcm-tools/commit/172050bcb9d496f0a2c46e13a274e5d6f370265a))
* Update Rollup TypeScript plugin to official version  ([20c0f25](https://github.com/paraspell/xcm-tools/commit/20c0f25224a86b859ac1ad043c5cf04febdf743e))
* **xcm-api:** Remove old XCM API code =t ([973dfde](https://github.com/paraspell/xcm-tools/commit/973dfde2cc6206ebdee90b45bda1cd871c0063b3))
* **xcm-router:** Modify fee calculations ([9e0f19b](https://github.com/paraspell/xcm-tools/commit/9e0f19bab007b58033dacde352e2529530b380b5))


### Documentation

* Add TSDoc reference comments to exported functions =Ä ([73b8cfe](https://github.com/paraspell/xcm-tools/commit/73b8cfe6d0944a0ea2c649552c844501ad10b19c))


### Miscellaneous Chores

* Add consistent type imports ESlint rule  ([61c20ae](https://github.com/paraspell/xcm-tools/commit/61c20ae24b83d871a6a5e3819e09748df3026061))
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
* **main:** release sdk 5.0.1 ([#194](https://github.com/paraspell/xcm-tools/issues/194)) ([37f35a8](https://github.com/paraspell/xcm-tools/commit/37f35a858e705712a09922740430cbd59d284385))
* **main:** release sdk 5.1.0 ([50f4fac](https://github.com/paraspell/xcm-tools/commit/50f4fac35ceba338daf4a578b2df90fcf9522969))
* **main:** release sdk 5.10.0 ([034c0cf](https://github.com/paraspell/xcm-tools/commit/034c0cfd83cfaedc93ce03fc5f56a719db4877e4))
* **main:** release sdk 5.2.0 ([96f06f1](https://github.com/paraspell/xcm-tools/commit/96f06f148f3cb2aa4c781c98689e08877fe0c84c))
* **main:** release sdk 5.2.1 ([30f29b8](https://github.com/paraspell/xcm-tools/commit/30f29b8b605cc7bc81d78843750fe3ad9865e42b))
* **main:** release sdk 5.3.0 ([a98229f](https://github.com/paraspell/xcm-tools/commit/a98229faae4f0e02eca5e681459512d32fe0b37f))
* **main:** release sdk 5.4.0 ([e6476eb](https://github.com/paraspell/xcm-tools/commit/e6476eb9eba40375cb860b4ac157b1fa90b7f3a4))
* **main:** release sdk 5.4.1 ([13ee295](https://github.com/paraspell/xcm-tools/commit/13ee2951d5047be1d5114aa2c6209e193124add2))
* **main:** release sdk 5.4.2 ([76141d9](https://github.com/paraspell/xcm-tools/commit/76141d94954238df79006cefe3821b895556a0cb))
* **main:** release sdk 5.5.0 ([32949dd](https://github.com/paraspell/xcm-tools/commit/32949dd98ee90b551a91e0764532ca68a7bc8580))
* **main:** release sdk 5.6.0 ([42040f6](https://github.com/paraspell/xcm-tools/commit/42040f69f8a48a024bd732e19a962fbeeea71e1b))
* **main:** release sdk 5.7.0 ([d209a4e](https://github.com/paraspell/xcm-tools/commit/d209a4e522e260c2bfdba576f62c6088f10e058f))
* **main:** release sdk 5.8.0 ([ff041e7](https://github.com/paraspell/xcm-tools/commit/ff041e70b08b58a3c9c7806f8e0423c110788fd2))
* **main:** release sdk 5.9.0 ([204fe57](https://github.com/paraspell/xcm-tools/commit/204fe579368d3fd752bb861218f917f439e39063))
* **main:** release sdk 6.0.0 ([1cc276d](https://github.com/paraspell/xcm-tools/commit/1cc276d97c098b24287e52fea1ecc93c1f8a1e90))
* **main:** release sdk 6.1.0 ([dae0ae7](https://github.com/paraspell/xcm-tools/commit/dae0ae781641c3241224a7748b3410fa6bb802a5))
* **main:** release sdk 6.1.1 ([c0881df](https://github.com/paraspell/xcm-tools/commit/c0881dfd16372bc6ec5a3ef8f6acd7a5c50e470d))
* **main:** release sdk 6.2.0 ([f584b3c](https://github.com/paraspell/xcm-tools/commit/f584b3c3b0ca94103c5b6e14090075a93d94394c))
* **main:** release sdk 6.2.1 ([8784881](https://github.com/paraspell/xcm-tools/commit/878488186e45fd1bdede561d56d3e5f9f88ace6c))
* **main:** release sdk 6.2.2 ([f13a54d](https://github.com/paraspell/xcm-tools/commit/f13a54d655ebfaf5c672b721175954667e40fe5d))
* **main:** release sdk 6.2.3 ([a4c3ad3](https://github.com/paraspell/xcm-tools/commit/a4c3ad31d339ed771af3a97510a54c68138fe7ac))
* **main:** release sdk 6.2.4 ([f06cba9](https://github.com/paraspell/xcm-tools/commit/f06cba92644ededd340a664ab7539edf4beb340b))
* **main:** release sdk 7.0.0 ([d81660f](https://github.com/paraspell/xcm-tools/commit/d81660f64493bc811d265439ddf85b96836e9e8f))
* **main:** release sdk 7.0.1 ([5ff1443](https://github.com/paraspell/xcm-tools/commit/5ff144377da8806d002c5e5711b5f30d1c1715b1))
* **main:** release sdk 7.1.0 ([5afca54](https://github.com/paraspell/xcm-tools/commit/5afca5466da056f28d61af65012adbda5f25ec02))
* **main:** release sdk 7.1.1 ([9a303e6](https://github.com/paraspell/xcm-tools/commit/9a303e6cd8a4fe52b5c283ac19d652178d792ccc))
* **main:** release sdk 7.1.2 ([921f017](https://github.com/paraspell/xcm-tools/commit/921f017da385195a3b2493b39c894e00bc78505d))
* **main:** release sdk 7.2.0 ([52935c1](https://github.com/paraspell/xcm-tools/commit/52935c1e492cd3834f5ae6adf7a57792d7c22bf4))
* **main:** release sdk 7.2.1 ([fc947be](https://github.com/paraspell/xcm-tools/commit/fc947bed05772b309f6431e8e3109138ede430bb))
* **main:** release sdk 7.2.10 ([aebaffd](https://github.com/paraspell/xcm-tools/commit/aebaffd72796389ec27a469bb69e2e45a7289d57))
* **main:** release sdk 7.2.2 ([6d02218](https://github.com/paraspell/xcm-tools/commit/6d022184051ee2c781ebe9431ba772294c10ffa2))
* **main:** release sdk 7.2.3 ([822710b](https://github.com/paraspell/xcm-tools/commit/822710b63b5ef1064452829f82d7f8092d206c14))
* **main:** release sdk 7.2.4 ([3950350](https://github.com/paraspell/xcm-tools/commit/395035029e23191e36b3d8965b52d57ca4e29040))
* **main:** release sdk 7.2.5 ([d5e0e65](https://github.com/paraspell/xcm-tools/commit/d5e0e65203b5e048a88bf5d9c9ec6b3f5353c069))
* **main:** release sdk 7.2.6 ([a84031e](https://github.com/paraspell/xcm-tools/commit/a84031ebb929e8cad1c9b58e3fa48844af191a5f))
* **main:** release sdk 7.2.7 ([a0ac608](https://github.com/paraspell/xcm-tools/commit/a0ac6087953a62381e3bc067f7d6afd9735a663f))
* **main:** release sdk 7.2.8 ([dfe2ab5](https://github.com/paraspell/xcm-tools/commit/dfe2ab5159a9b9723a9eda6badde5469759c6726))
* **main:** release sdk 7.2.9 ([f2cb245](https://github.com/paraspell/xcm-tools/commit/f2cb24522f6653efc56180fa0696fcf5bdbce0b0))
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
* Perform a monthly check =à ([46a8802](https://github.com/paraspell/xcm-tools/commit/46a8802cb68a49b28f131b337e5b4b4731e01fd4))
* Perform monthly check =' ([fdcb194](https://github.com/paraspell/xcm-tools/commit/fdcb194681947b4e92ff8b34ebd7b3c84e6d0048))
* Perform monthly check =' ([b459bc4](https://github.com/paraspell/xcm-tools/commit/b459bc48044711b02e3ed1bf0ea1d9ddecd32098))
* Perform monthly maintenance check ([5b1b76a](https://github.com/paraspell/xcm-tools/commit/5b1b76a249d52568488242908581fe061dee2750))
* Perform monthly maintenance check  =h=' ([a85c3bd](https://github.com/paraspell/xcm-tools/commit/a85c3bd427b6d1d829155bf32a4524637eb78a1f))
* Perform monthly maintenance check =à ([e85ed15](https://github.com/paraspell/xcm-tools/commit/e85ed15e709ccf3b59f7aa8c0fcaf7134e0fe8a3))
* Perform montly check ( ([3f20805](https://github.com/paraspell/xcm-tools/commit/3f20805195f11ca9f37c57f1c6ee6e37c07f6edc))
* Perform November monthly check =' ([6aceb38](https://github.com/paraspell/xcm-tools/commit/6aceb38be5fd65c9f7dbfd037bdcc947c9cf37d8))
* **sdk:** Add advanced symbol selection info ([a4db9c3](https://github.com/paraspell/xcm-tools/commit/a4db9c3dc33768cd247980454f4bbcce3fe49689))
* **sdk:** Add changes ([64af95c](https://github.com/paraspell/xcm-tools/commit/64af95c3eaba8003793e2ed56c50ebeb92921554))
* **sdk:** Add claimAssets+MultiassetArray to Readme ([99abab9](https://github.com/paraspell/xcm-tools/commit/99abab9aa42e4506122fd5e281ec9126e198dd11))
* **sdk:** Add readme ([029bf6f](https://github.com/paraspell/xcm-tools/commit/029bf6f5892f564d51387fb24a6dd7ab9bb0ce92))
* **sdk:** Add transfer info docs ([7754941](https://github.com/paraspell/xcm-tools/commit/7754941e639f75d0e3882cc627103c0881d0c148))
* **sdk:** fix readme ([0ec4dcc](https://github.com/paraspell/xcm-tools/commit/0ec4dcc25fc381001e0d4827bd2d41e92ac872e5))
* **sdk:** Fix supportedNodes.md ([9dcee6c](https://github.com/paraspell/xcm-tools/commit/9dcee6c8184f35f1e57af3eed722bed18fca403e))
* **sdk:** Fix typos ([678eb6a](https://github.com/paraspell/xcm-tools/commit/678eb6ac5ee4c5beed067891599d73e70ee9564e))
* **sdk:** Perform monthly check ™ ([0edf441](https://github.com/paraspell/xcm-tools/commit/0edf441af391711f4884032a8ed0f9c3b1818cc6))
* **sdk:** Perform monthly maintenance check =à ([71e0bdd](https://github.com/paraspell/xcm-tools/commit/71e0bdd6e4df2c87bb428a66d6dea637131f27c1))
* **sdk:** Remove docs and replace link in Readme ([bfa11cd](https://github.com/paraspell/xcm-tools/commit/bfa11cd2c3d8493ceb73a6b45ae8cba3c2cfb33d))
* **sdk:** Run maintenance scripts ([2503c84](https://github.com/paraspell/xcm-tools/commit/2503c8441bbd628570da366d4bee6a68e7b329b7))
* **sdk:** run prettier ([936d9a3](https://github.com/paraspell/xcm-tools/commit/936d9a31e1733bb5bef7b854483f87531bed9cf0))
* **sdk:** Update docs about PAPI ([50db221](https://github.com/paraspell/xcm-tools/commit/50db221e01294d42855318d5c7f3516cd85ca3b5))
* **sdk:** Update documentation ([aec7f13](https://github.com/paraspell/xcm-tools/commit/aec7f1305ba011de8f11f32cd011100bdbec8ba5))
* **sdk:** Update License ([042a62b](https://github.com/paraspell/xcm-tools/commit/042a62bf4e90412e55552b053042619fe8559033))
* **sdk:** Update optional ws_url parameter ([c6fb8ae](https://github.com/paraspell/xcm-tools/commit/c6fb8aea82236e3a2fbb95ade336744f96396886))
* **sdk:** Update readme ([c64e35b](https://github.com/paraspell/xcm-tools/commit/c64e35b7de41f396f15bddc8716c15a0c975662d))
* **sdk:** Update Readme ([8599604](https://github.com/paraspell/xcm-tools/commit/85996041d51228502b33ac0e1216a941b8db715e))
* **sdk:** Update readme and docs ([f8d6613](https://github.com/paraspell/xcm-tools/commit/f8d6613a77d302229fac98e427b040096111eb24))
* **sdk:** Update readme with PJS-less PAPI version ([896bc60](https://github.com/paraspell/xcm-tools/commit/896bc600bbe44efa1b2c26db691b230b7fec7db5))
* **sdk:** Update README.md ([0fd4655](https://github.com/paraspell/xcm-tools/commit/0fd4655627a7e643d7fff52af8cee9720a91e6b8))
* **sdk:** Update README.md ([a7dad60](https://github.com/paraspell/xcm-tools/commit/a7dad60befc0f97c647ea79b525622d7aa1397d2))
* **sdk:** Update README.md ([1fbb395](https://github.com/paraspell/xcm-tools/commit/1fbb395d04466e3cbf34e13617faabe62dd6bb40))
* **sdk:** Update README.md ([48b950a](https://github.com/paraspell/xcm-tools/commit/48b950a5f004fbcc5a14c13dba33830d0ea75613))
* **sdk:** Update README.md ([eb79ad1](https://github.com/paraspell/xcm-tools/commit/eb79ad18d34482aac6223156bdd2a1139d08b88b))
* **sdk:** Update supportedNodes.md ([08bc76e](https://github.com/paraspell/xcm-tools/commit/08bc76e918f5a3baaa37ace223adebfc7005ce65))
* **sdk:** Update supportedNodes.md ([f9b13ec](https://github.com/paraspell/xcm-tools/commit/f9b13eca32a4f178406ec404283ddaed27927ea8))
* **sdk:** Update supportedNodes.md ([6743d23](https://github.com/paraspell/xcm-tools/commit/6743d23c9ff46b1a7f875f1bd9cc72f1bdba11c0))
* Update docs ([1cea10f](https://github.com/paraspell/xcm-tools/commit/1cea10f78a1377ce4526dba7a54ad3a806afc024))
* Update Node.js to v20 LTS ([4b00caa](https://github.com/paraspell/xcm-tools/commit/4b00caa58649051f4dea57e7f6ebb94baa6e307a))
* Update Polkadot dependencies to latest version ([319ec70](https://github.com/paraspell/xcm-tools/commit/319ec70e4f3771f0ca339f770d6474a8fcceb8ed))
* Update SDK dependencies ™ ([281d5c7](https://github.com/paraspell/xcm-tools/commit/281d5c7a5fd043c7a5b3d323218ccfdba9ef0a56))
* **xcm-tools:** Add readme ([4de56b2](https://github.com/paraspell/xcm-tools/commit/4de56b24d62a3158e07a701334b81ed2d1722a98))
* **xcm-tools:** Add starter template projects to readme ([8e9cbf7](https://github.com/paraspell/xcm-tools/commit/8e9cbf7f6a8c25e7bf7dd48287d0dd66557c4c02))
* **xcm-tools:** Update readme ([c10bdbb](https://github.com/paraspell/xcm-tools/commit/c10bdbb8ce16b5e8700c30f8b82d1912f604b966))
* **xcm-tools:** Update readme ([66f9278](https://github.com/paraspell/xcm-tools/commit/66f92788d60589dc92e0ec388b1870968551fcbe))
* **xcm-tools:** Update readme to reflect latest changes ([65c7a72](https://github.com/paraspell/xcm-tools/commit/65c7a72963eaf9eaba147a13c2b9da654d5cf8fb))


### Code Refactoring

* Create separate packages for assets and common code ( ([d1ed352](https://github.com/paraspell/xcm-tools/commit/d1ed3523e86219916e810fffa06e53b2a3ef96ea))
* Create separate packages for assets and common code e ( ([371b3ec](https://github.com/paraspell/xcm-tools/commit/371b3ec72558e2177c6d7129871820ad50a02a4e))
* Improve builder type safety =' ([41389de](https://github.com/paraspell/xcm-tools/commit/41389dee44246fc83d46f45512f97433fd773b50))
* **playground:** Use builder method for dry-run =' ([915662f](https://github.com/paraspell/xcm-tools/commit/915662f88103de5e6bc060f10fbef4ea73acc7d5))
* Refactor scripts code ([91db3fe](https://github.com/paraspell/xcm-tools/commit/91db3fe2a1bdaecee5ef469a40725b0c334a9947))
* **sdk-core:** Refactor override currency logic =' ([6f4f636](https://github.com/paraspell/xcm-tools/commit/6f4f63685402907efb18b6346ce4c189773d219f))
* **sdk-core:** Refactor override currency logic =' ([905e9c5](https://github.com/paraspell/xcm-tools/commit/905e9c5355fd7e0f1e8defbef34d4247e6b39f9d))
* **sdk:** Add types and remove 'any' from TTransfer.ts file >é ([3c50ba7](https://github.com/paraspell/xcm-tools/commit/3c50ba7070fbae9eb2a71b72c054be94ef884525))
* **sdk:** Add types for method property ( ([58abfb6](https://github.com/paraspell/xcm-tools/commit/58abfb6efcb3bcaa3bf12ea62399806cb6680c75))
* **sdk:** Add types for MultiLocations structures ([13c417b](https://github.com/paraspell/xcm-tools/commit/13c417b1d57d8cfa81a669692e1c24d1be2b5a73))
* **sdk:** Generalize Builder class - preparation for PAPI implementation =à ([5d3f34f](https://github.com/paraspell/xcm-tools/commit/5d3f34f8937d33e8a3d823988a8966f841ae9064))
* **sdk:** Generalize PolkadotJS code ™ ([582fbdf](https://github.com/paraspell/xcm-tools/commit/582fbdfce3c907cc464352867bc80d007f81cc99))
* **sdk:** Refactor ParaToPara and ParaToRelay transfer function >Ñ=» ([4d49456](https://github.com/paraspell/xcm-tools/commit/4d49456273141a9b973cb31d481331c542e96dac))
* **sdk:** Refactor transferRelayToPara function =' ([608ff63](https://github.com/paraspell/xcm-tools/commit/608ff638c012fd9c69d44097317d31f424855ede))
* **sdk:** Remove duplicate code from Astar, Shiden classes ([c347cd0](https://github.com/paraspell/xcm-tools/commit/c347cd021abd983b7f8c8544ebee281f9f1695e2))
* **sdk:** Split types.ts file into multiple organized type definition files ([951e6ca](https://github.com/paraspell/xcm-tools/commit/951e6ca2d7b77d5b04aba2f594634155ddd1dddd))
* **sdk:** Update README.md ([8330056](https://github.com/paraspell/xcm-tools/commit/8330056bd37e916e734dec8709d6001648cc5ede))
* Upgrade ESlint to v9 & create shared config ([524161b](https://github.com/paraspell/xcm-tools/commit/524161b9a9509c3beb15af99bfc0151c7eeb5619))
* **xcm-api:** Use automatic api creating ( ([3e840b1](https://github.com/paraspell/xcm-tools/commit/3e840b1ab1d141c97bfd6322d83a62d4199d9305))


### Tests

* Improve overall unit test coverage to above 90% >ê ([aeb32bb](https://github.com/paraspell/xcm-tools/commit/aeb32bb6a54c1bc2e527cf587b8e0a44e3c397a5))
* Refactor and improve SDK e2e tests >ê ([7220d0d](https://github.com/paraspell/xcm-tools/commit/7220d0dc529ab7e08a35cc3cb2e87e5569634792))
* **sdk-core:** Add assets E2E tests >ê ([e3dee4e](https://github.com/paraspell/xcm-tools/commit/e3dee4edd4d80cb4a806ed711862e5b9e3bb862e))
* **sdk:** Correctly mock ApiPromise in Builder / transfer tests >ê ([8e01c4f](https://github.com/paraspell/xcm-tools/commit/8e01c4f6fd40190b6be4cae7d1adf14533cd964d))


### Build System

* Add sort-imports ESlint rule ( ([d9bd402](https://github.com/paraspell/xcm-tools/commit/d9bd4024ba87f6c8fedad012100ea76fdf7658c8))
* **sdk:** Setup more benevolent peer dependencies =æ ([be65545](https://github.com/paraspell/xcm-tools/commit/be655457f7673e5c5d47cc7ccb39278fe7463989))


### Continuous Integration

* Integrate Codecov PR comments =¬ ([220da1b](https://github.com/paraspell/xcm-tools/commit/220da1b6d060b7aa4d8262e779256e40ce145f3f))
* Setup Codecov bundle analysis =æ ([c3e0e53](https://github.com/paraspell/xcm-tools/commit/c3e0e535cef0e2d8dd77035cb10ee596163d54a0))
* Update Node.js to v22 LTS =æ ([f7d4902](https://github.com/paraspell/xcm-tools/commit/f7d49029e295fb4bd3840ab27abe40d3168beae5))
</details>

<details><summary>sdk-pjs: 9.0.0</summary>

## [9.0.0](https://github.com/paraspell/xcm-tools/compare/sdk-pjs-v8.9.1...sdk-pjs-v9.0.0) (2025-03-24)


###   BREAKING CHANGES

* Split SDK into separate packages for PJS and PAPI (

### Features

* Add eth fee function & new transfers ( ([0ec3c78](https://github.com/paraspell/xcm-tools/commit/0ec3c78e449c58640b4f439eeb5a32b332d70e92))
* Add support for new Snowbridge routes ( ([cd87b23](https://github.com/paraspell/xcm-tools/commit/cd87b23193c0fd84d09e33e0892e97c6646fedc4))
* **sdk-core:** Add builder method for api disconnecting & Update docs ([5771425](https://github.com/paraspell/xcm-tools/commit/5771425b5c33ae788c03171d5c27c755a9add1d1))
* **sdk-core:** Add support for pallet/method override ( ([aa11c6b](https://github.com/paraspell/xcm-tools/commit/aa11c6b0b8484b7566d76b6d2c6bf1821b840b6d))
* **sdk-core:** Add support for PolkadotXCM execute transfers ( ([7387c96](https://github.com/paraspell/xcm-tools/commit/7387c96ab45dbc4e20cfa8254f808c5d621504b7))
* **sdk-core:** Add support for PolkadotXCM execute transfers ( ([3fee6ac](https://github.com/paraspell/xcm-tools/commit/3fee6ac6f45808758ebcbf1fedddbd3e825bcbd2))
* Split SDK into separate packages for PJS and PAPI ( ([ff465e9](https://github.com/paraspell/xcm-tools/commit/ff465e92e57640f525c7d350afec0b9dcf364453))
* **xcm-router:** Add support for precise exchange auto-select ( ([ee018a3](https://github.com/paraspell/xcm-tools/commit/ee018a38f72cba5b8e20b4f7d537a6ad4027f92a))


### Bug Fixes

* Add PAPI support for Moonbeam -&gt; Ethereum transfer ( ([84b80c3](https://github.com/paraspell/xcm-tools/commit/84b80c3539106313b6cfa90279f1eee249ecabdd))
* Enable support for bigint literals ( ([0090106](https://github.com/paraspell/xcm-tools/commit/0090106babe2dcecf66d4eaa532d3963a230958b))
* Fix assets export =à ([cdf1d03](https://github.com/paraspell/xcm-tools/commit/cdf1d03a90e11c9f15a76c6fd77475f89e71d536))
* Fix batch transfers for PAPI & Improve playground symbol selection ( ([e6f38b1](https://github.com/paraspell/xcm-tools/commit/e6f38b17bdb7dd9cdc6d898485c7ba2a2ed8e191))
* Fix ESlint errors & Update Snowbridge SDK ([9049acc](https://github.com/paraspell/xcm-tools/commit/9049acc68991a89174199cb799f4d3a9756cf855))
* Fix package json warnings =' ([de6ea5d](https://github.com/paraspell/xcm-tools/commit/de6ea5df89513753b7a83e4053121a4b207a97c5))
* Improve EVM builder ( ([76afbf3](https://github.com/paraspell/xcm-tools/commit/76afbf3505460fbe85d4a91190a45e14cd8f2491))
* **playground:** Improve mobile responsivity=ñ ([ecdf91b](https://github.com/paraspell/xcm-tools/commit/ecdf91b14882b72b637f800cd76d08f1ecf8f6aa))
* Remove ahAddress field in favor of senderAddress & Router fixes =' ([9c2680a](https://github.com/paraspell/xcm-tools/commit/9c2680afe64caec8b7e91b2e1a584cf8e527eb8e))
* **sdk-core:** Accept public key address =Ç ([46ed82d](https://github.com/paraspell/xcm-tools/commit/46ed82d6c140b2a02d5449e10b2d3df0a49f10cd))
* **sdk-core:** Add multi-locations to native assets ([8e40da1](https://github.com/paraspell/xcm-tools/commit/8e40da1450722e37de7cf0365a806e424b58c453))
* **sdk-core:** Fix dry run =' ([7864be5](https://github.com/paraspell/xcm-tools/commit/7864be50ff1de8a398920e44a6d4eb2bcbc217a7))
* **sdk-core:** Remove keep alive feature =' ([5d7761e](https://github.com/paraspell/xcm-tools/commit/5d7761ede0c87e7b6c00e4d1f416323409211870))
* **sdk-core:** Validate sender address in dry-run function =à ([f71efde](https://github.com/paraspell/xcm-tools/commit/f71efde6c1419bf15f5e9b8775d901483d410731))
* **sdk-pjs:** Fix Snowbridge transfers not working for some wallets =' ([b846b70](https://github.com/paraspell/xcm-tools/commit/b846b708e90675b3e47c3da1b2142a1ef2528f0a))
* Update Rollup TypeScript plugin to official version  ([20c0f25](https://github.com/paraspell/xcm-tools/commit/20c0f25224a86b859ac1ad043c5cf04febdf743e))
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
* Perform monthly check =' ([fdcb194](https://github.com/paraspell/xcm-tools/commit/fdcb194681947b4e92ff8b34ebd7b3c84e6d0048))
* Perform monthly check =' ([b459bc4](https://github.com/paraspell/xcm-tools/commit/b459bc48044711b02e3ed1bf0ea1d9ddecd32098))
* Perform monthly maintenance check  =h=' ([a85c3bd](https://github.com/paraspell/xcm-tools/commit/a85c3bd427b6d1d829155bf32a4524637eb78a1f))
* **xcm-tools:** Update readme ([c10bdbb](https://github.com/paraspell/xcm-tools/commit/c10bdbb8ce16b5e8700c30f8b82d1912f604b966))


### Code Refactoring

* Create separate packages for assets and common code ( ([d1ed352](https://github.com/paraspell/xcm-tools/commit/d1ed3523e86219916e810fffa06e53b2a3ef96ea))
* Create separate packages for assets and common code e ( ([371b3ec](https://github.com/paraspell/xcm-tools/commit/371b3ec72558e2177c6d7129871820ad50a02a4e))
* Improve builder type safety =' ([41389de](https://github.com/paraspell/xcm-tools/commit/41389dee44246fc83d46f45512f97433fd773b50))
* **playground:** Use builder method for dry-run =' ([915662f](https://github.com/paraspell/xcm-tools/commit/915662f88103de5e6bc060f10fbef4ea73acc7d5))
* **sdk-core:** Refactor override currency logic =' ([6f4f636](https://github.com/paraspell/xcm-tools/commit/6f4f63685402907efb18b6346ce4c189773d219f))
* **sdk-core:** Refactor override currency logic =' ([905e9c5](https://github.com/paraspell/xcm-tools/commit/905e9c5355fd7e0f1e8defbef34d4247e6b39f9d))
* **xcm-api:** Use automatic api creating ( ([3e840b1](https://github.com/paraspell/xcm-tools/commit/3e840b1ab1d141c97bfd6322d83a62d4199d9305))


### Tests

* Refactor and improve SDK e2e tests >ê ([7220d0d](https://github.com/paraspell/xcm-tools/commit/7220d0dc529ab7e08a35cc3cb2e87e5569634792))
* **sdk-core:** Add assets E2E tests >ê ([e3dee4e](https://github.com/paraspell/xcm-tools/commit/e3dee4edd4d80cb4a806ed711862e5b9e3bb862e))


### Build System

* Add sort-imports ESlint rule ( ([d9bd402](https://github.com/paraspell/xcm-tools/commit/d9bd4024ba87f6c8fedad012100ea76fdf7658c8))
* Bump React version to v19 =æ ([3a3bbfe](https://github.com/paraspell/xcm-tools/commit/3a3bbfed4d1532fe7d09e89e5958ee1e8dd975d9))
</details>

<details><summary>sdk-common: 9.0.0</summary>

## [9.0.0](https://github.com/paraspell/xcm-tools/compare/sdk-common-v8.9.1...sdk-common-v9.0.0) (2025-03-24)


### Features

* **sdk-core:** Add support for additional &lt;&gt;Polimec transfers >„ ([600e0e6](https://github.com/paraspell/xcm-tools/commit/600e0e6935bcac72d98b92b0c68b2a92669934e4))
* **sdk-core:** Add support for additional &lt;&gt;Polimec transfers >„ ([7cb2768](https://github.com/paraspell/xcm-tools/commit/7cb27684676642704314922c12a8347576da6d0f))


### Miscellaneous Chores

* **main:** release main libraries ([e49d724](https://github.com/paraspell/xcm-tools/commit/e49d72434cec8fc28edb55b2afc195f24a18718b))
* **main:** release main libraries ([f84aa87](https://github.com/paraspell/xcm-tools/commit/f84aa8738812d3c90984599c51ddad5661a69129))
* **main:** release main libraries ([d43690c](https://github.com/paraspell/xcm-tools/commit/d43690c8b28ae651e8bcd002e415b3c929d6190d))
* **main:** release main libraries ([9381e35](https://github.com/paraspell/xcm-tools/commit/9381e3511f57bc9b5c6d98fdc4c8eec6acfcce66))


### Code Refactoring

* Change multi-location type ( ([997e605](https://github.com/paraspell/xcm-tools/commit/997e605a1f5816ac44f4a18ee90859a677c55141))
* Create separate packages for assets and common code ( ([d1ed352](https://github.com/paraspell/xcm-tools/commit/d1ed3523e86219916e810fffa06e53b2a3ef96ea))
* Create separate packages for assets and common code e ( ([371b3ec](https://github.com/paraspell/xcm-tools/commit/371b3ec72558e2177c6d7129871820ad50a02a4e))


### Tests

* Fix assets, pallets package coverage >ê ([9d935ba](https://github.com/paraspell/xcm-tools/commit/9d935baf487045a46ee97bc0ef8b90cc76e3c749))
* Fix assets, pallets package coverage >ê ([bc92024](https://github.com/paraspell/xcm-tools/commit/bc92024e529e0b8333bfa7df80048b574c7b778c))
</details>

<details><summary>assets: 9.0.0</summary>

## [9.0.0](https://github.com/paraspell/xcm-tools/compare/assets-v8.9.1...assets-v9.0.0) (2025-03-24)


### Features

* **sdk-core:** Add support for additional &lt;&gt;Polimec transfers >„ ([600e0e6](https://github.com/paraspell/xcm-tools/commit/600e0e6935bcac72d98b92b0c68b2a92669934e4))
* **sdk-core:** Add support for additional &lt;&gt;Polimec transfers >„ ([7cb2768](https://github.com/paraspell/xcm-tools/commit/7cb27684676642704314922c12a8347576da6d0f))


### Bug Fixes

* Fix ESlint errors & Update Snowbridge SDK ([9049acc](https://github.com/paraspell/xcm-tools/commit/9049acc68991a89174199cb799f4d3a9756cf855))


### Miscellaneous Chores

* **main:** release main libraries ([e49d724](https://github.com/paraspell/xcm-tools/commit/e49d72434cec8fc28edb55b2afc195f24a18718b))
* **main:** release main libraries ([f84aa87](https://github.com/paraspell/xcm-tools/commit/f84aa8738812d3c90984599c51ddad5661a69129))
* **main:** release main libraries ([d43690c](https://github.com/paraspell/xcm-tools/commit/d43690c8b28ae651e8bcd002e415b3c929d6190d))
* **main:** release main libraries ([9381e35](https://github.com/paraspell/xcm-tools/commit/9381e3511f57bc9b5c6d98fdc4c8eec6acfcce66))


### Code Refactoring

* Change multi-location type ( ([997e605](https://github.com/paraspell/xcm-tools/commit/997e605a1f5816ac44f4a18ee90859a677c55141))
* Create separate packages for assets and common code ( ([d1ed352](https://github.com/paraspell/xcm-tools/commit/d1ed3523e86219916e810fffa06e53b2a3ef96ea))
* Create separate packages for assets and common code e ( ([371b3ec](https://github.com/paraspell/xcm-tools/commit/371b3ec72558e2177c6d7129871820ad50a02a4e))
* Create separate pallets package =æ ([62fa967](https://github.com/paraspell/xcm-tools/commit/62fa96753698ed2d5d5d21492c7d2447ad613006))
</details>

<details><summary>pallets: 9.0.0</summary>

## [9.0.0](https://github.com/paraspell/xcm-tools/compare/pallets-v8.9.1...pallets-v9.0.0) (2025-03-24)


### Features

* **sdk-core:** Add support for additional &lt;&gt;Polimec transfers >„ ([7cb2768](https://github.com/paraspell/xcm-tools/commit/7cb27684676642704314922c12a8347576da6d0f))


### Miscellaneous Chores

* **main:** release main libraries ([e49d724](https://github.com/paraspell/xcm-tools/commit/e49d72434cec8fc28edb55b2afc195f24a18718b))
* **main:** release main libraries ([f84aa87](https://github.com/paraspell/xcm-tools/commit/f84aa8738812d3c90984599c51ddad5661a69129))
* **main:** release main libraries ([d43690c](https://github.com/paraspell/xcm-tools/commit/d43690c8b28ae651e8bcd002e415b3c929d6190d))
* **main:** release main libraries ([9381e35](https://github.com/paraspell/xcm-tools/commit/9381e3511f57bc9b5c6d98fdc4c8eec6acfcce66))


### Code Refactoring

* Change multi-location type ( ([997e605](https://github.com/paraspell/xcm-tools/commit/997e605a1f5816ac44f4a18ee90859a677c55141))
* Create separate packages for assets and common code ( ([d1ed352](https://github.com/paraspell/xcm-tools/commit/d1ed3523e86219916e810fffa06e53b2a3ef96ea))
* Create separate pallets package =æ ([62fa967](https://github.com/paraspell/xcm-tools/commit/62fa96753698ed2d5d5d21492c7d2447ad613006))


### Tests

* Fix assets, pallets package coverage >ê ([9d935ba](https://github.com/paraspell/xcm-tools/commit/9d935baf487045a46ee97bc0ef8b90cc76e3c749))
* Fix assets, pallets package coverage >ê ([bc92024](https://github.com/paraspell/xcm-tools/commit/bc92024e529e0b8333bfa7df80048b574c7b778c))
</details>

<details><summary>xcm-router: 9.0.0</summary>

## [9.0.0](https://github.com/paraspell/xcm-tools/compare/xcm-router-v8.9.1...xcm-router-v9.0.0) (2025-03-24)


###   BREAKING CHANGES

* Split SDK into separate packages for PJS and PAPI (
* **sdk:** Refactor transfer Builder to explicitly include from, to parameters for relaychains

### Features

* Add Select component for selecting assets ([850483f](https://github.com/paraspell/xcm-tools/commit/850483fc75dbef266b46a5bbb15da8517985c620))
* Add support for Polkadot and Kusama bridge ([0b935fe](https://github.com/paraspell/xcm-tools/commit/0b935fecf6e49e7e58abb1efee239bce53126a0b))
* **playground:** Add support for multi-assets to playground =Ý ([132f475](https://github.com/paraspell/xcm-tools/commit/132f4753e49f89f479cd29043b67917ad9993755))
* **playground:** Improve playground ( ([441fa6f](https://github.com/paraspell/xcm-tools/commit/441fa6fb197f2b8f35f34c14fd8f94dcdc15635d))
* **sdk-core:** Add support for additional &lt;&gt;Polimec transfers >„ ([600e0e6](https://github.com/paraspell/xcm-tools/commit/600e0e6935bcac72d98b92b0c68b2a92669934e4))
* **sdk-core:** Add support for PolkadotXCM execute transfers ( ([7387c96](https://github.com/paraspell/xcm-tools/commit/7387c96ab45dbc4e20cfa8254f808c5d621504b7))
* **sdk-core:** Add support for PolkadotXCM execute transfers ( ([3fee6ac](https://github.com/paraspell/xcm-tools/commit/3fee6ac6f45808758ebcbf1fedddbd3e825bcbd2))
* **sdk:** Add asset search by multi-location ( ([54d0d46](https://github.com/paraspell/xcm-tools/commit/54d0d46d96e4b17b315856a61563a13209fef026))
* **sdk:** Add fail-safe support ( ([18b1328](https://github.com/paraspell/xcm-tools/commit/18b1328ba3f079d03adebc67ba2d15634d115055))
* **sdk:** Add MultiLocation override feature Ó ([eb6cdbe](https://github.com/paraspell/xcm-tools/commit/eb6cdbedd8bdfb2570e0bc94192afe6079a20b11))
* **sdk:** Add support for abstracted assets selection ( ([b5ffed8](https://github.com/paraspell/xcm-tools/commit/b5ffed8958aa5680a5ffc9308f0f7f0dd1c1d727))
* **sdk:** Add support for Moonbeam EVM transfers ( ([d30ba8e](https://github.com/paraspell/xcm-tools/commit/d30ba8e941c9f0835b35d9887339e88e9f1986e8))
* **sdk:** Refactor transfer Builder to explicitly include from, to parameters for relaychains ([395b45e](https://github.com/paraspell/xcm-tools/commit/395b45e2d1bfe68c84cea7d19b44e16f2a3b4cd8))
* Split SDK into separate packages for PJS and PAPI ( ([ff465e9](https://github.com/paraspell/xcm-tools/commit/ff465e92e57640f525c7d350afec0b9dcf364453))
* **xcm-api:** Add support for XCM Router API Snowbridge transfers ([c468a80](https://github.com/paraspell/xcm-tools/commit/c468a804845fa3fd78649f01af7eee32a7305aae))
* **xcm-router:** Add getBestAmountOut function to builder >„ ([8e0e46e](https://github.com/paraspell/xcm-tools/commit/8e0e46e9d16b1fae7b53df5266519034598ffd9b))
* **xcm-router:** Add Snowbridge transfers support D ([d69fda6](https://github.com/paraspell/xcm-tools/commit/d69fda6e723f3e7e7820c2eeaf2800975d43b53f))
* **xcm-router:** Add support for AssetHub DEX ( ([274ad41](https://github.com/paraspell/xcm-tools/commit/274ad41d8e7f70f327d2918a8d2fd0aca5374101))
* **xcm-router:** Add support for EVM signer ([569f4fc](https://github.com/paraspell/xcm-tools/commit/569f4fc3e0316df4ac82a1b4f3714a7528548c14))
* **xcm-router:** Add support for precise exchange auto-select ( ([ee018a3](https://github.com/paraspell/xcm-tools/commit/ee018a38f72cba5b8e20b4f7d537a6ad4027f92a))
* **xcm-router:** Add support for precise exchange auto-select ( ([18d65d8](https://github.com/paraspell/xcm-tools/commit/18d65d8dead2ef68c71e956a41ea0b1dcca3993b))
* **xcm-router:** Refactor currency inputs ( ([28db4a9](https://github.com/paraspell/xcm-tools/commit/28db4a918f896f496a5b8c984d9f0413d6f827ae))
* **xcm-router:** Remove Mangata DEX ([b601bbf](https://github.com/paraspell/xcm-tools/commit/b601bbffc8ba285b159c14cc395dc27594f1a068))
* **xcm-router:** Remove Snowbridge support =' ([cb5e5f3](https://github.com/paraspell/xcm-tools/commit/cb5e5f3737f607aa734e551279f53cf34d735915))


### Bug Fixes

* Add destination address checks ([f072da7](https://github.com/paraspell/xcm-tools/commit/f072da7c032ed9fb871191f4975115e779608ed0))
* Add no-console rule to ESlint configuration ( ([d58a744](https://github.com/paraspell/xcm-tools/commit/d58a744c8fb4a892697eed9fca0f5514c7dfb243))
* Enable support for bigint literals ( ([0090106](https://github.com/paraspell/xcm-tools/commit/0090106babe2dcecf66d4eaa532d3963a230958b))
* Fix ignored ESlint errors =' ([495fc06](https://github.com/paraspell/xcm-tools/commit/495fc067758db128df1d0c46c1c2534dc28aaf3f))
* Fix package json warnings =' ([de6ea5d](https://github.com/paraspell/xcm-tools/commit/de6ea5df89513753b7a83e4053121a4b207a97c5))
* Fix WS endpoints timing out ([32f34b8](https://github.com/paraspell/xcm-tools/commit/32f34b8eecaf46be06b968bbd97b817860dd8e52))
* **playground:** Remove Ethereum option from some selects ( ([825702e](https://github.com/paraspell/xcm-tools/commit/825702e55f2cfab2d52f0c3c6bfcab7904b285a5))
* Properly handle smaller amounts in exchanges ([6004c13](https://github.com/paraspell/xcm-tools/commit/6004c137c470719ed5d3f9c138c59a187b6e42a2))
* Remove ahAddress field in favor of senderAddress & Router fixes =' ([9c2680a](https://github.com/paraspell/xcm-tools/commit/9c2680afe64caec8b7e91b2e1a584cf8e527eb8e))
* **sdk-core:** Add complete multi-locations for AH assets ([8d5e2ce](https://github.com/paraspell/xcm-tools/commit/8d5e2ce855f9becd5afb446d88e36111ec8bf47f))
* **sdk-core:** Add multi-locations to native assets ([8e40da1](https://github.com/paraspell/xcm-tools/commit/8e40da1450722e37de7cf0365a806e424b58c453))
* **sdk-pjs:** Fix Snowbridge transfers not working for some wallets =' ([b846b70](https://github.com/paraspell/xcm-tools/commit/b846b708e90675b3e47c3da1b2142a1ef2528f0a))
* **sdk:** Remove @polkadot/apps-config depencency ([8a5bbc7](https://github.com/paraspell/xcm-tools/commit/8a5bbc7e5f31ec928e4be2714a69f666fd706fd1))
* Update Rollup TypeScript plugin to official version  ([20c0f25](https://github.com/paraspell/xcm-tools/commit/20c0f25224a86b859ac1ad043c5cf04febdf743e))
* **xcm-api:** Remove old XCM API code =t ([973dfde](https://github.com/paraspell/xcm-tools/commit/973dfde2cc6206ebdee90b45bda1cd871c0063b3))
* **xcm-router:** Add missing methods to Router builder ([fac5bc0](https://github.com/paraspell/xcm-tools/commit/fac5bc01fb33bc1e54a8d7d99622efb27c218073))
* **xcm-router:** Add missing Router builder methods ([2048e9c](https://github.com/paraspell/xcm-tools/commit/2048e9c380b94ed788f0176ecb28276d551538f6))
* **xcm-router:** Fix handling small amounts before sending XCM to exchange ([ae27b5b](https://github.com/paraspell/xcm-tools/commit/ae27b5b4bbbce3ad9bfa656ce5cea1186de067e9))
* **xcm-router:** Modify fee calculations ([9e0f19b](https://github.com/paraspell/xcm-tools/commit/9e0f19bab007b58033dacde352e2529530b380b5))
* **xcm-router:** Update Acala SDK to latest version =æ ([011fb29](https://github.com/paraspell/xcm-tools/commit/011fb2931fd9de98acc40706a1e2a0eb9b07be27))


### Documentation

* Add TSDoc reference comments to exported functions =Ä ([73b8cfe](https://github.com/paraspell/xcm-tools/commit/73b8cfe6d0944a0ea2c649552c844501ad10b19c))


### Miscellaneous Chores

* Add consistent type imports ESlint rule  ([61c20ae](https://github.com/paraspell/xcm-tools/commit/61c20ae24b83d871a6a5e3819e09748df3026061))
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
* **main:** release xcm-router 1.1.0 ([#200](https://github.com/paraspell/xcm-tools/issues/200)) ([8efc755](https://github.com/paraspell/xcm-tools/commit/8efc755ac31ed37612f135b4b7c108c9680e52d2))
* **main:** release xcm-router 1.1.1 ([#213](https://github.com/paraspell/xcm-tools/issues/213)) ([3022cd7](https://github.com/paraspell/xcm-tools/commit/3022cd7c27c35e543f4715ab86ac8a50647e4d66))
* **main:** release xcm-router 1.2.0 ([75964fc](https://github.com/paraspell/xcm-tools/commit/75964fc5b9d313b347734dfc706e09f98ed5c761))
* **main:** release xcm-router 1.2.1 ([#286](https://github.com/paraspell/xcm-tools/issues/286)) ([3d6e25c](https://github.com/paraspell/xcm-tools/commit/3d6e25c13b8e7684fc1a452d9893cf61a042dac2))
* **main:** release xcm-router 1.2.2 ([920edf0](https://github.com/paraspell/xcm-tools/commit/920edf0d99aa775fa417e149b8a134ec98f2b5d0))
* **main:** release xcm-router 1.3.0 ([33e7a36](https://github.com/paraspell/xcm-tools/commit/33e7a36789adb4e4127c1c32e066baa3dbb08900))
* **main:** release xcm-router 1.4.0 ([576f2cf](https://github.com/paraspell/xcm-tools/commit/576f2cf2efffcf2352b450ae351453caa1791f50))
* **main:** release xcm-router 1.4.1 ([f6939f2](https://github.com/paraspell/xcm-tools/commit/f6939f2408c748fc2cf5d3776674e2d6cca72265))
* **main:** release xcm-router 1.5.0 ([d52c61e](https://github.com/paraspell/xcm-tools/commit/d52c61eaba4519d9624e46caafdb98e183403a38))
* **main:** release xcm-router 2.0.0 ([41f5dfa](https://github.com/paraspell/xcm-tools/commit/41f5dfa3c556c48a20f331eb62420ca8d0d762f6))
* **main:** release xcm-router 2.1.0 ([0979efc](https://github.com/paraspell/xcm-tools/commit/0979efc1aff0d057939f112361a6518307f6a6bf))
* **main:** release xcm-router 2.2.0 ([ccd07b9](https://github.com/paraspell/xcm-tools/commit/ccd07b996e730bca430f739bd68c39175cf0746f))
* **main:** release xcm-router 2.2.1 ([b3917f3](https://github.com/paraspell/xcm-tools/commit/b3917f317532028ffde69d2b2752a26cad7f3c5f))
* **main:** release xcm-router 2.2.2 ([41be7cc](https://github.com/paraspell/xcm-tools/commit/41be7cc68d6bc0e8f01bebf78a26af525356967d))
* **main:** release xcm-router 2.2.3 ([f5b0a28](https://github.com/paraspell/xcm-tools/commit/f5b0a28142ed6f622a4ec9650f1946ac27ebf612))
* **main:** release xcm-router 2.3.0 ([1d0233f](https://github.com/paraspell/xcm-tools/commit/1d0233f7b07187173ffc2df03b5057e591cfdfae))
* Perform a monthly check =à ([46a8802](https://github.com/paraspell/xcm-tools/commit/46a8802cb68a49b28f131b337e5b4b4731e01fd4))
* Perform monthly check =' ([fdcb194](https://github.com/paraspell/xcm-tools/commit/fdcb194681947b4e92ff8b34ebd7b3c84e6d0048))
* Perform monthly check =' ([b459bc4](https://github.com/paraspell/xcm-tools/commit/b459bc48044711b02e3ed1bf0ea1d9ddecd32098))
* Perform monthly maintenance check ([5b1b76a](https://github.com/paraspell/xcm-tools/commit/5b1b76a249d52568488242908581fe061dee2750))
* Perform monthly maintenance check  =h=' ([a85c3bd](https://github.com/paraspell/xcm-tools/commit/a85c3bd427b6d1d829155bf32a4524637eb78a1f))
* Perform monthly maintenance check =à ([e85ed15](https://github.com/paraspell/xcm-tools/commit/e85ed15e709ccf3b59f7aa8c0fcaf7134e0fe8a3))
* Perform montly check ( ([3f20805](https://github.com/paraspell/xcm-tools/commit/3f20805195f11ca9f37c57f1c6ee6e37c07f6edc))
* Perform November monthly check =' ([6aceb38](https://github.com/paraspell/xcm-tools/commit/6aceb38be5fd65c9f7dbfd037bdcc947c9cf37d8))
* Remove unused standard-version package =( ([f36f10c](https://github.com/paraspell/xcm-tools/commit/f36f10ccbdf67ec61fea78a9fe20030b5fcea705))
* **sdk:** Perform monthly check ™ ([0edf441](https://github.com/paraspell/xcm-tools/commit/0edf441af391711f4884032a8ed0f9c3b1818cc6))
* **sdk:** Perform monthly maintenance check =à ([71e0bdd](https://github.com/paraspell/xcm-tools/commit/71e0bdd6e4df2c87bb428a66d6dea637131f27c1))
* Update docs ([1cea10f](https://github.com/paraspell/xcm-tools/commit/1cea10f78a1377ce4526dba7a54ad3a806afc024))
* Update Node.js to v20 LTS ([4b00caa](https://github.com/paraspell/xcm-tools/commit/4b00caa58649051f4dea57e7f6ebb94baa6e307a))
* Update Polkadot dependencies to latest version ([319ec70](https://github.com/paraspell/xcm-tools/commit/319ec70e4f3771f0ca339f770d6474a8fcceb8ed))
* Update readme ([fd92c72](https://github.com/paraspell/xcm-tools/commit/fd92c72edcf16ec4450606f0e5938cf1f5a3bc01))
* **xcm-router:** Default to builder pattern ([82b6305](https://github.com/paraspell/xcm-tools/commit/82b6305c0bceeab9ea84e4a6797aa4b6ba06d2bc))
* **xcm-router:** Update all dependencies ([b71eaec](https://github.com/paraspell/xcm-tools/commit/b71eaec3ee5c2fb2a73e37e2b0fb3013a2d53b95))
* **xcm-router:** Update License ([1422afe](https://github.com/paraspell/xcm-tools/commit/1422afe61d08cb9083fa3d724e900b1f7d54ec86))
* **xcm-router:** Update README.md ([879f672](https://github.com/paraspell/xcm-tools/commit/879f6725dd7e360e1faa94e7bb793a491ef77d33))
* **xcm-router:** Update README.md ([c38cb49](https://github.com/paraspell/xcm-tools/commit/c38cb49c50c39b02ab84a2a4c5e9cb5e4fd45fa0))
* **xcm-router:** Update README.md ([0b24925](https://github.com/paraspell/xcm-tools/commit/0b2492503dc573379ec2f1b988939bf89316133a))
* **xcm-tools:** Add starter template projects to readme ([8e9cbf7](https://github.com/paraspell/xcm-tools/commit/8e9cbf7f6a8c25e7bf7dd48287d0dd66557c4c02))
* **xcm-tools:** Update readme to reflect latest changes ([65c7a72](https://github.com/paraspell/xcm-tools/commit/65c7a72963eaf9eaba147a13c2b9da654d5cf8fb))


### Code Refactoring

* Change multi-location type ( ([997e605](https://github.com/paraspell/xcm-tools/commit/997e605a1f5816ac44f4a18ee90859a677c55141))
* Create separate packages for assets and common code ( ([d1ed352](https://github.com/paraspell/xcm-tools/commit/d1ed3523e86219916e810fffa06e53b2a3ef96ea))
* Create separate packages for assets and common code e ( ([371b3ec](https://github.com/paraspell/xcm-tools/commit/371b3ec72558e2177c6d7129871820ad50a02a4e))
* **sdk-core:** Refactor override currency logic =' ([6f4f636](https://github.com/paraspell/xcm-tools/commit/6f4f63685402907efb18b6346ce4c189773d219f))
* **sdk-core:** Refactor override currency logic =' ([905e9c5](https://github.com/paraspell/xcm-tools/commit/905e9c5355fd7e0f1e8defbef34d4247e6b39f9d))
* Upgrade ESlint to v9 & create shared config ([524161b](https://github.com/paraspell/xcm-tools/commit/524161b9a9509c3beb15af99bfc0151c7eeb5619))
* **xcm-router:** Enhance XCM Router to use only 2 signatures  ([f4f1761](https://github.com/paraspell/xcm-tools/commit/f4f17614a2842af69b4b8ef0480f3df531ce9eed))
* **xcm-router:** Improve asset selection and validation >„ ([138f633](https://github.com/paraspell/xcm-tools/commit/138f633fbe3e2de851dd70be305e792208350320))
* **xcm-router:** Reduce unit tests code duplication & add tests for small amount error ([384803d](https://github.com/paraspell/xcm-tools/commit/384803da3528087124fe2f2182d7d4ee8fdf9120))
* **xcm-router:** Refactor to use route plan object =à ([3650a42](https://github.com/paraspell/xcm-tools/commit/3650a4254c9fa8dc442a8b0fe00abfcc91b7d63d))
* **xcm-router:** Refactor transfer functions =' ([420db1e](https://github.com/paraspell/xcm-tools/commit/420db1ec3361add1a24764ac0d6a6d6353d31032))


### Tests

* Improve overall unit test coverage to above 90% >ê ([aeb32bb](https://github.com/paraspell/xcm-tools/commit/aeb32bb6a54c1bc2e527cf587b8e0a44e3c397a5))
* **xcm-router:** Speed up XCM Router tests >ê ([e1e2373](https://github.com/paraspell/xcm-tools/commit/e1e2373f6c4b7a515d6af8d805d66bef28b19110))


### Build System

* Add sort-imports ESlint rule ( ([d9bd402](https://github.com/paraspell/xcm-tools/commit/d9bd4024ba87f6c8fedad012100ea76fdf7658c8))
* Update all package commands to use pnpm ([5478cf3](https://github.com/paraspell/xcm-tools/commit/5478cf3166613eb7fdd9571bc20811d45d1d2fcd))
* **xcm-router:** Bump @galacticcouncil/sdk to v5.3.0 =æ ([8830300](https://github.com/paraspell/xcm-tools/commit/8830300d594f14f1780dbf918212e3d88a34ec2d))
* **xcm-router:** Update Bifrost DEX SDK =æ ([fe85f27](https://github.com/paraspell/xcm-tools/commit/fe85f273c6371c27a97e86c57d59b8913f5bff68))


### Continuous Integration

* Integrate Codecov PR comments =¬ ([220da1b](https://github.com/paraspell/xcm-tools/commit/220da1b6d060b7aa4d8262e779256e40ce145f3f))
* Setup Codecov bundle analysis =æ ([c3e0e53](https://github.com/paraspell/xcm-tools/commit/c3e0e535cef0e2d8dd77035cb10ee596163d54a0))
* Update Node.js to v22 LTS =æ ([f7d4902](https://github.com/paraspell/xcm-tools/commit/f7d49029e295fb4bd3840ab27abe40d3168beae5))
</details>

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).