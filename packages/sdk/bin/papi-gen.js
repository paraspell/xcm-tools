#!/usr/bin/env node

import { exec, execSync } from 'child_process'

const lowercaseFirstLetter = value => value.charAt(0).toLowerCase() + value.slice(1)

const nodes = [
  { node: 'AssetHubPolkadot', wsProvider: 'wss://asset-hub-polkadot-rpc.dwellir.com' },
  { node: 'Acala', wsProvider: 'wss://acala-rpc.dwellir.com' },
  { node: 'Astar', wsProvider: 'wss://rpc.astar.network' },
  { node: 'BifrostPolkadot', wsProvider: 'wss://bifrost-polkadot-rpc.dwellir.com' },
  { node: 'Bitgreen', wsProvider: 'wss://mainnet.bitgreen.org' },
  { node: 'BridgeHubPolkadot', wsProvider: 'wss://bridge-hub-polkadot-rpc.dwellir.com' },
  { node: 'BridgeHubKusama', wsProvider: 'wss://bridge-hub-kusama-rpc.dwellir.com' },
  { node: 'Centrifuge', wsProvider: 'wss://fullnode.centrifuge.io' },
  { node: 'Darwinia', wsProvider: 'wss://rpc.darwinia.network' },
  { node: 'Hydration', wsProvider: 'wss://hydradx-rpc.dwellir.com' },
  { node: 'Litentry', wsProvider: 'wss://litentry-rpc.dwellir.com' },
  { node: 'Moonbeam', wsProvider: 'wss://moonbeam-rpc.dwellir.com' },
  { node: 'AssetHubKusama', wsProvider: 'wss://asset-hub-kusama-rpc.dwellir.com' },
  { node: 'CoretimeKusama', wsProvider: 'wss://coretime-kusama-rpc.dwellir.com' },
  { node: 'CoretimePolkadot', wsProvider: 'wss://coretime-polkadot.dotters.network' },
  { node: 'Encointer', wsProvider: 'wss://encointer-kusama-rpc.dwellir.com' },
  { node: 'Altair', wsProvider: 'wss://fullnode.altair.centrifuge.io' },
  { node: 'Amplitude', wsProvider: 'wss://rpc-amplitude.pendulumchain.tech' },
  { node: 'Bajun', wsProvider: 'wss://rpc-parachain.bajun.network' },
  { node: 'Basilisk', wsProvider: 'wss://rpc.basilisk.cloud' },
  { node: 'BifrostKusama', wsProvider: 'wss://bifrost-rpc.dwellir.com' },
  { node: 'Calamari', wsProvider: 'wss://calamari.systems' },
  { node: 'Crab', wsProvider: 'wss://crab-rpc.darwinia.network/' },
  { node: 'Imbue', wsProvider: 'wss://kusama.imbuenetwork.com' },
  { node: 'Integritee', wsProvider: 'wss://kusama.api.integritee.network' },
  { node: 'InvArchTinker', wsProvider: 'wss://tinkernet-rpc.dwellir.com' },
  { node: 'Karura', wsProvider: 'wss://karura-rpc.dwellir.com' },
  { node: 'Moonriver', wsProvider: 'wss://moonriver-rpc.dwellir.com' },
  { node: 'Quartz', wsProvider: 'wss://quartz-rpc.dwellir.com' },
  { node: 'Shiden', wsProvider: 'wss://rpc.shiden.astar.network' },
  { node: 'Unique', wsProvider: 'wss://unique-rpc.dwellir.com' },
  { node: 'Crust', wsProvider: 'wss://crust-parachain.crustapps.net' },
  { node: 'Manta', wsProvider: 'wss://ws.manta.systems' },
  { node: 'Nodle', wsProvider: 'wss://nodle-rpc.dwellir.com' },
  { node: 'NeuroWeb', wsProvider: 'wss://neuroweb-rpc.dwellir.com' },
  { node: 'Zeitgeist', wsProvider: 'wss://zeitgeist.api.onfinality.io/public-ws' },
  { node: 'Collectives', wsProvider: 'wss://collectives-polkadot-rpc.dwellir.com' },
  { node: 'Khala', wsProvider: 'wss://khala-rpc.dwellir.com' },
  { node: 'Phala', wsProvider: 'wss://phala-rpc.dwellir.com' },
  { node: 'KiltSpiritnet', wsProvider: 'wss://spiritnet.kilt.io/' },
  { node: 'Curio', wsProvider: 'wss://parachain.curioinvest.com/' },
  { node: 'Mythos', wsProvider: 'wss://polkadot-mythos-rpc.polkadot.io' },
  { node: 'Peaq', wsProvider: 'wss://peaq.api.onfinality.io/public-ws' },
  { node: 'Polimec', wsProvider: 'wss://polimec.rpc.amforc.com' }
]

async function generateDescriptorForNode(node, wsProvider) {
  try {
    console.log(`Generating descriptor for ${node}... - ${wsProvider}`)

    await new Promise((resolve, reject) => {
      exec(
        `pnpm exec papi add --skip-codegen ${lowercaseFirstLetter(node)} -w ${wsProvider}`,
        { timeout: 30000 }, // 30 seconds timeout
        (error, stdout, stderr) => {
          if (error) {
            console.error(`Error for provider ${wsProvider}: ${stderr}`)
            reject(error)
          } else {
            console.log(`Descriptor for ${node} added successfully: ${stdout}`)
            resolve()
          }
        }
      )
    })
  } catch (error) {
    console.warn(`Failed to generate descriptor for ${node} using ${wsProvider}:`, error.message)
  }
}

async function generateAllDescriptors() {
  for (const { node, wsProvider } of nodes) {
    await generateDescriptorForNode(node, wsProvider)
  }

  try {
    execSync('pnpm exec papi')
    console.log('All types generated successfully.')
  } catch (error) {
    console.error('Failed to generate types:', error.message)
  }
}

const args = process.argv.slice(2)

if (args[0] === 'papi:gen') {
  generateAllDescriptors()
} else {
  console.log('Unknown command. Available commands: papi:gen')
}
