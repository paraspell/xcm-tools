<h1 align="center">
ParaSpell✨ monorepo for XCM-Tool set
</h1>

<p align="center">
<img width="400" alt="ParaSpell logo" src="https://github.com/paraspell/xcm-tools/assets/55763425/a65e3626-84cf-444b-ab77-9375508e5895">
</p>

**Monorepo contains the following XCM tools:**
- [XCM API](https://github.com/paraspell/xcm-tools/tree/main/apps/xcm-api) (LightSpell⚡️): Meant to ease the integration of XCM interoperability into your dApp, offload your dApp from heavy computing and save you costs.
- [XCM ROUTER](https://github.com/paraspell/xcm-tools/tree/main/packages/xcm-router) (SpellRouter☄️): Meant to allow you to create XCM calls where you receive different assets than assets you send (Eg. Send -> DOT from Polkadot, receive ASTR on Astar)—all in just one call.
- [XCM SDK](https://github.com/paraspell/xcm-tools/tree/main/packages/sdk): Meant to unify cross-chain experience on Polkadot and become a layer 2 protocol that allows for seamless integration of XCM into your dApps.

**Other:**
- [XCM Tools playground](https://github.com/paraspell/xcm-tools/tree/main/apps/playground): Playground for testing/trying all three mentioned XCM tools.
- [XCM API landing page](https://github.com/paraspell/xcm-tools/tree/main/apps/landing-page): XCM API Professional landing page

**Documentation:**
- [XCM Tools documentation](https://paraspell.github.io/docs/): Comprehensive documentation for XCM tools mentioned above.

**Monorepo infrastructure:**
```
apps | - Playground
     | - XCM API
     | - XCM API Landing page

packages | - XCM SDK
         | - XCM Router
```

**Monorepo commands:**

These commands will be run on all packages in monorepo.

- Run compilation using `pnpm compile`

- Run formatter using `pnpm format:check`

- Run linter using `pnpm lint`

- Run unit tests using `pnpm test`
  
- Build all packages and apps using `pnpm build`

- Launch playground from root using `pnpm run:playground`

To run command only for specific package or app in monorepo use:

`pnpm --filter <package_selector> <command>` or cd into appropriate folder.

<br/>

**Tools supported by:**
<div align="center">
      <img width="200" alt="version" src="https://user-images.githubusercontent.com/55763425/211145923-f7ee2a57-3e63-4b7d-9674-2da9db46b2ee.png" />
</div>
