<h1 align="center">
ParaSpell✨ monorepo for XCM-Tool set
</h1>

<p align="center">
<img width="400" alt="ParaSpell logo" src="https://github.com/paraspell/xcm-tools/assets/55763425/a65e3626-84cf-444b-ab77-9375508e5895">
</p>

**AI-generated podcast about ParaSpell XCM tools:**

Tired of reading? Listen to this [AI generated Podcast about ParaSpell XCM Tools (New version)](https://notebooklm.google.com/notebook/ff1837d7-2ab2-4e0f-9420-49c8a4cbec97/audio).

**Monorepo contains the following XCM tools:**
- [XCM SDK](https://github.com/paraspell/xcm-tools/tree/main/packages/sdk) 🪄: A tool designed to unify the cross-chain experience on Polkadot and serve as a layer 2 protocol that enables seamless integration of XCM into your decentralized applications. Having **two** versions: [PolkadotAPI Version](https://github.com/paraspell/xcm-tools/tree/main/packages/sdk) & [PolkadotJS Version](https://github.com/paraspell/xcm-tools/tree/main/packages/sdk-pjs) as the `first` and `only` XCM SDK in the ecosystem.
- [XCM API](https://github.com/paraspell/xcm-tools/tree/main/apps/xcm-api) ⚡️ (<img width="50" alt="Lightspell logo" src="https://user-images.githubusercontent.com/55763425/251588168-4855abc3-445a-4207-9a65-e891975be62c.png">): An API that provides the ability to integrate XCM interoperability into your decentralized application in package-less way offloading heavy computing tasks from your decentralized application, and reducing associated costs.
- [XCM ROUTER](https://github.com/paraspell/xcm-tools/tree/main/packages/xcm-router) ☄️ (<img width="50" alt="Spellrouter logo" src="https://raw.githubusercontent.com/paraspell/presskit/refs/heads/main/logos_spellrouter/Full%20name.png">): A tool aiming to provide the capability of cross-chain swaps where you receive different assets than those you send (e.g. send DOT from Polkadot and receive ASTR on Astar) — all within a single command.
- [XCM Analyser](https://github.com/paraspell/xcm-tools/tree/main/packages/xcm-analyser) 🔎 - Analyser package to convert XCM Multilocations into a human-readable format.
- [XCM Visualizator](https://github.com/paraspell/xcm-tools/tree/main/apps/visualizator-fe) 🖼️ - An application developed to visualize XCM within the Polkadot ecosystem.

**Other:**
- [XCM Tools playground](https://github.com/paraspell/xcm-tools/tree/main/apps/playground) 🛝: Playground for testing/trying all three mentioned XCM tools.
- [XCM Tools landing page](https://github.com/paraspell/xcm-tools/tree/main/apps/site) 🛬: XCM Tools Professional landing page.
- [XCM API landing page](https://github.com/paraspell/xcm-tools/tree/main/apps/lightspell-site) 🛬: XCM API Professional landing page.

**Documentation:**
- [XCM Tools documentation](https://paraspell.github.io/docs/) 📚: Comprehensive documentation for XCM tools mentioned above.

<br>

<details><summary><b>Starter templates:</b></summary>  
<br>

- [XCM SDK (React + Vite) starter template](https://github.com/paraspell/xcm-sdk-template) 🛫: Advanced cross-chain dApp starter template using XCM SDK 
- [XCM API (React + Vite) starter template](https://github.com/paraspell/xcm-api-template) 🛫: Advanced cross-chain dApp starter template using XCM API
- [XCM Router (React + Vite) starter template](https://github.com/paraspell/xcm-router-template) 🛫: Advanced cross-chain dApp starter template using XCM Router

</details>

<details><summary><b>Monorepo infrastructure:</b></summary>
     
```
apps | - XCM Playground
     | - XCM API
     | - XCM API Landing page
     | - XCM Tools Landing page
     | - XCM Visualizator FE
     | - XCM Visualizator BE

packages | - XCM SDK
         | - XCM SDK-PJS
         | - XCM SDK-Core
         | - XCM SDK-Common
         | - XCM Router
         | - XCM Analyser
         | - Assets
         | - Pallets
```

</details>

<details><summary><b>Monorepo commands:</b></summary>
<br>

**These commands will be run on all packages in the monorepo.**

Make sure to run the following two commands first (from repository root), before running any others below:

- Install necessary node modules using `pnpm install`

- Build all packages and apps using `pnpm build`

Afterwards, you should be able to use any of the following commands (from repository root):

- Run compilation using ```pnpm compile```

- Run formatter using `pnpm format:check`

- Run formatter with write permissions using `pnpm format:write`

- Run linter using `pnpm lint:check`

- Run unit tests using `pnpm test`

- Run integration tests using `pnpm test:integration`

- Run end-to-end tests using `pnpm test:e2e`

- Launch the XCM Tools Playground from the root using `pnpm run:playground`

- Launch XCM API from the root using `pnpm run:api`

- Launch the landing page from the root using `pnpm run:landing-page`

- Run asset update script for XCM SDK from the root using `pnpm run:updateAssets`

- Run the existential deposit update script for XCM SDK from the root using `run:updateEds`

- Run the pallet update script for XCM SDK from the root using `pnpm run:updatePallets`

- Run asset update script for XCM Router from the root using `pnpm run:updateRouterAssets`

**To run a command only for a specific package or app in a monorepo, use:**

`pnpm --filter <package_selector> <command>` or cd into appropriate folder.

</details>

<details><summary><b>XCM Tools bug bounty:</b></summary>
<br>

**Contribute to XCM Tools and earn rewards 💰**

We run an open Bug Bounty Program that rewards contributors for reporting and fixing bugs in the project. More information on bug bounty can be found in the [official documentation](https://paraspell.github.io/docs/contribution.html).

</details>

<br>

**Tools supported by:**
<div align="center">
      <img width="750" alt="version" src="https://github.com/user-attachments/assets/29e4b099-d90c-46d6-a3ce-94edfbda003c" />



</div>
