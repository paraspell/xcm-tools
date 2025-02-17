import type { Contract, Signer } from 'ethers'
import type { Abi, GetContractReturnType, WalletClient } from 'viem'

export const isEthersSigner = (signer: Signer | WalletClient): signer is Signer =>
  typeof signer === 'object' && signer !== null && 'provider' in signer

export const isEthersContract = (
  contract: Contract | GetContractReturnType<Abi | readonly unknown[]>
): contract is Contract => !('abi' in contract)
