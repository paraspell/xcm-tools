
<br /><br />

<div align="center">
  <h1 align="center">XCM Visualizator FE</h1>
  <h4 align="center">The 🥇 XCM Visualizator in Polkadot & Kusama ecosystem.</h4>
  <h4 align="center">Effortlessly Decode and Visualize Complex Cross-Chain Messaging Data.</h4>
  <p align="center">
    <a href="https://github.com/paraspell/xcm-sdk/actions">
      <img alt="build" src="https://github.com/paraspell/xcm-tools/actions/workflows/ci.yml/badge.svg" />
    </a>
  </p>
  <p align="center"> Now live at https://xcm-visualizator.paraspell.xyz/</p>
  <p>XCM Visualizator documentation <a href = "https://paraspell.github.io/docs/visualizator/getting-start.html" \>[here]</p>
</div>

<br /><br />
<br /><br />

## Introduction
<img width="200" alt="logo" src="https://github.com/paraspell/xcm-tools/assets/55763425/2a2a071d-32c5-4fea-a6cb-fc5177c73548.png">


With the Polkadot ecosystem and its cross-chain message format (XCM) growing rapidly, there is a huge demand for visualization of this technology's capability.
Potential investors or network stakeholders can now observe important details about network infrastructure, which could help them decide on an ideal network worth investing in.

**Reasons to use this visualization tool for the exploration of the ecosystem and XCM:**

- First and only XCM-oriented visualization tool in the ecosystem
- Send XCM messages in all three scenarios (HRMP, UMP, DMP)
- Ability to observe how the network scaled in time (Go through specific selected history)
- Find out which chains participate in cross-chain messaging the most
- Observe which accounts are most active in cross-chain messaging
- Detect which channels are used the most
- See which assets are transferred the most
- Discover how many messages were sent at a specific time frame
- Learn all details mentioned above for any chain you select (Even multiple chains at the same time)
- Customize the selected time frame
- Customize colour schemes to make your desired details stand out even more
- Always have the latest data - Visualizator updates for new XCM messages every day (Automatically)
- Open source and 100% free forever

## Problem addressed

There are no XCM visualization tools in the ecosystem. Users, especially investors who wish to invest in the network or its infrastructure (Parachains) could benefit from such a tool by finding out specific cross-chain details for any chain in the ecosystem. Currently, the network focuses primarily on development rather than visualization - hence the lack of visualization tools. Data scientists could use this tool to extract crucial information that could help resolve potential bottlenecks or surges in cross-chain messages throughout the ecosystems. They can also create informative reports about the state of networks in the ecosystem as well as create predictions or plans to increase growth in certain areas. **XCM Visualizator can greatly enhance the visualization tool set in the Polkadot ecosystem.**

## Tech stack

TypeScript

**Front end:**

- Vite,
- Three.js,
- React Three Fiber,
- Mantine UI

## Development

The production version of the XCM Visualizator is available at [https://xcm-visualizator.paraspell.xyz/](https://xcm-visualizator.paraspell.xyz/).

To run the project locally, you need to have Node.js v.20^ installed, as well as PostgreSQL database.

In backend folder create .env file following .env.example file. After your database is set up, you can import the database dump from the [xcm_database_dump.tar](https://drive.google.com/file/d/1mBYi9zh8iuEWtQtcZdg-sgGtRwJFRLje/view?usp=sharing) file to try the XCM Visualizator with the example data.

Then, run the following commands:

Install dependencies:

```bash
//This has to be run from monorepository root
pnpm install
pnpm build
```

Run backend from [backend folder](https://github.com/paraspell/xcm-tools/tree/main/apps/visualizator-be):

```bash
pnpm start
```

Run frontend:

```bash
pnpm dev
```

## Contribute to XCM Tools and earn rewards 💰

We run an open Bug Bounty Program that rewards contributors for reporting and fixing bugs in the project. More information on bug bounty can be found in the [official documentation](https://paraspell.github.io/docs/contribution.html).

## Get Support 🚑

- Contact form on our [landing page](https://paraspell.xyz/#contact-us).
- Message us on our [X](https://x.com/paraspell).
- Support channel on [telegram](https://t.me/paraspell).

## License

Made with 💛 by [ParaSpell✨](https://github.com/paraspell)

Published under [MIT License](https://github.com/paraspell/xcm-tools/blob/main/apps/visualizator-fe/LICENSE).
