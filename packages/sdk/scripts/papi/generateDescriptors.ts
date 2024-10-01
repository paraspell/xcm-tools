import { execSync, exec } from 'child_process'
import {
  getNodeProvider,
  getAllNodeProviders,
  TNodePolkadotKusama,
  NODE_NAMES_DOT_KSM
} from '../../src'

const lowercaseFirstLetter = (value: string) => value.charAt(0).toLowerCase() + value.slice(1)
const notWorkingNodes: {
  node: TNodePolkadotKusama
  reason: string
}[] = []

async function generateDescriptorForNode(node: TNodePolkadotKusama) {
  let providers: string[] = []
  let hasErrored = false
  let hasTimedOut = false

  // Attempt to get all WS providers, fallback to a single provider if it fails
  try {
    providers = getAllNodeProviders(node)
  } catch (error) {
    console.error(
      `Failed to get all providers for ${node}: ${error.message}. Falling back to single provider.`
    )
    const fallbackProvider = getNodeProvider(node)
    if (fallbackProvider) {
      providers.push(fallbackProvider)
    } else {
      notWorkingNodes.push({
        node,
        reason: 'No providers found (neither multiple nor fallback available)'
      })
      return
    }
  }

  for (const wsProvider of providers) {
    try {
      console.log(`Generating descriptor for ${node}... - ${wsProvider}`)

      // Run the papi add command with a timeout of 120 seconds (120,000 ms)
      await new Promise<void>((resolve, reject) => {
        exec(
          `pnpm exec papi add --skip-codegen ${lowercaseFirstLetter(node)} -w ${wsProvider}`,
          { timeout: 30000 }, // 30 seconds timeout
          (error, stdout, stderr) => {
            if (error) {
              if (error.killed) {
                console.error(`Timeout for provider ${wsProvider}`)
                hasTimedOut = true
              } else {
                console.error(`Error for provider ${wsProvider}: ${stderr}`)
                hasErrored = true
              }
              reject(error)
            } else {
              console.log(`Descriptor for ${node} added successfully: ${stdout}`)
              resolve()
            }
          }
        )
      })

      // If successful, break out of the loop
      return
    } catch (error) {
      console.warn(`Failed to generate descriptor for ${node} using ${wsProvider}:`, error.message)
    }
  }

  // If all providers failed, decide if it was due to timeouts or errors
  if (hasTimedOut && !hasErrored) {
    notWorkingNodes.push({
      node,
      reason: 'TIMED_OUT'
    })
  } else if (hasErrored) {
    notWorkingNodes.push({
      node,
      reason: 'ERROR'
    })
  }
}

async function generateAllDescriptors() {
  for (const node of NODE_NAMES_DOT_KSM) {
    await generateDescriptorForNode(node)
  }

  // Attempt to generate types after processing all nodes
  try {
    execSync('pnpm exec papi')
    console.log('All types generated successfully.')
  } catch (error) {
    console.error('Failed to generate types:', error.message)
  }

  // Print nodes that couldn't have their descriptors generated
  if (notWorkingNodes.length > 0) {
    console.log('Failed to generate descriptors for the following nodes:', notWorkingNodes)
  }
}

// Execute the function
void generateAllDescriptors()
