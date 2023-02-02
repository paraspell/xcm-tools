import { getDefaultPallet, getSupportedPallets, TNode } from '@paraspell/sdk'

export const runPalletsExample = () => {
    const node: TNode = 'Acala'

    const defaultPallet = getDefaultPallet(node)
    console.log(`Default pallet for ${node} is ${defaultPallet}.`)

    const supportedPallets = getSupportedPallets(node)
    console.log(`Supported pallets for ${node} are ${supportedPallets}.`);
}

