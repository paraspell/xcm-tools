
<br /><br />

<div align="center">
  <h1 align="center">XCM Visualizer FE</h1>
  <h4 align="center">The 🥇 XCM Visualizer in Polkadot & Kusama ecosystem.</h4>
  <h4 align="center">Effortlessly Decode and Visualize Complex Cross-Chain Messaging Data.</h4>
  <p align="center">
    <a href="https://github.com/paraspell/xcm-sdk/actions">
      <img alt="build" src="https://github.com/paraspell/xcm-tools/actions/workflows/ci.yml/badge.svg" />
    </a>
  </p>
  <p align="center">Live at https://xcm-visualizer.paraspell.xyz/</p>
  <p>XCM Visualizer documentation <a href = "https://paraspell.github.io/docs/visualizer/getting-start.html" \>[here]</p>
</div>

<br /><br />
<br /><br />

## Developer guide

1. Install dependencies:
   - Node.js `^24`
   - PostgreSQL

2. Configure environment variables:
   - In the `backend` directory, create a `.env` file based on `.env.example`
   - Update it with your local PostgreSQL credentials

3. Initialize the database:
   - Import the [xcm_database_dump_2023_2024](https://drive.google.com/file/d/1v7z85kz-ez_0Vy8GffMEuWlWq2_T2dQq/view) file into your PostgreSQL database to load example data for the XCM Visualizer

4. Run the following commands:

   Before you begin with any commands make sure to run following from monorepository root:
    
    ```bash
    pnpm install
    pnpm build
    ```
    
    Then run backend from [backend folder](https://github.com/paraspell/xcm-tools/tree/main/apps/visualizer-be):
    
    ```bash
    cd ./apps/visualizer-be
    pnpm start
    ```
    
    And run frontend:
    
    ```bash
    cd ./apps/visualizer-fe
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

Published under [MIT License](https://github.com/paraspell/xcm-tools/blob/main/apps/visualizer-be/LICENSE).

Deployed on [Netfify](https://www.netlify.com/) ⚙️
