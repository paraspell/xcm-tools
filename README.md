<h1 align="center">
ParaSpell✨ monorepo for XCM-Tool set
</h1>

<p align="center">
<img width="400" alt="ParaSpell logo" src="https://github.com/paraspell/xcm-tools/assets/55763425/a65e3626-84cf-444b-ab77-9375508e5895">
</p>

**AI-generated podcast about ParaSpell XCM tools:**

Tired of reading? Listen to this AI-generated podcast about ParaSpell XCM Tools here - [AI Podcast about ParaSpell](https://notebooklm.google.com/notebook/4707adaa-0abf-417d-b48f-0f387e3625d3/audio)

**Monorepo contains the following XCM tools:**
- [XCM SDK](https://github.com/paraspell/xcm-tools/tree/main/packages/sdk) 🪄: A tool designed to unify the cross-chain experience on Polkadot and serve as a layer 2 protocol that enables seamless integration of XCM into your decentralized applications.
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

**Starter templates:**
- [XCM SDK (React + Vite) starter template](https://github.com/paraspell/xcm-sdk-template) 🛫: Advanced cross-chain dApp starter template using XCM SDK 
- [XCM API (React + Vite) starter template](https://github.com/paraspell/xcm-api-template) 🛫: Advanced cross-chain dApp starter template using XCM API
- [XCM Router (React + Vite) starter template](https://github.com/paraspell/xcm-router-template) 🛫: Advanced cross-chain dApp starter template using XCM Router

**Monorepo infrastructure:**
```
apps | - XCM Playground
     | - XCM API
     | - XCM API Landing page
     | - XCM Tools Landing page
     | - XCM Visualizator FE
     | - XCM Visualizator BE

packages | - XCM SDK
         | - XCM Router
         | - XCM Analyser
```

**Monorepo commands:**

These commands will be run on all packages in monorepo.

- Run compilation using `pnpm compile`

- Run formatter using `pnpm format:check`

- Run formatter with write permissions using `pnpm format:wríte`

- Run linter using `pnpm lint:check`

- Run unit tests using `pnpm test`

- Run integration tests using `pnpm test:integration`

- Run end-to-end tests using `pnpm test:e2e`
  
- Build all packages and apps using `pnpm build`

- Launch playground from the root using `pnpm run:playground`

- Launch XCM API from the root using `pnpm run:api`

- Launch the landing page from the root using `pnpm run:landing-page`

- Run asset update script for XCM SDK from the root using `pnpm run:updateAssets`

- Run existential deposit update script for XCM SDK from the root using `run:updateEds`

- Run pallet update script for XCM SDK from the root using `pnpm run:updatePallets`

- Run asset update script for XCM Router from the root using `pnpm run:updateRouterAssets`

To run command only for specific package or app in monorepo use:

`pnpm --filter <package_selector> <command>` or cd into appropriate folder.

<br/>

**Tools supported by:**
<div align="center">
      <img width="200" alt="version" src="https://user-images.githubusercontent.com/55763425/211145923-f7ee2a57-3e63-4b7d-9674-2da9db46b2ee.png" />
</div>
