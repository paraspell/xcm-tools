import { describe, it, expect } from 'vitest'
import type { Contract, Signer } from 'ethers'
import type { Abi, GetContractReturnType, WalletClient } from 'viem'
import { isEthersContract, isEthersSigner } from './utils'

describe('isEthersSigner', () => {
  it('returns true when the object has a provider property', () => {
    const mockEthersSigner = { provider: {} } as unknown as Signer
    expect(isEthersSigner(mockEthersSigner)).toBe(true)
  })

  it('returns false when the object does not have a provider property', () => {
    const mockWalletClient = { chain: {} } as WalletClient
    expect(isEthersSigner(mockWalletClient)).toBe(false)
  })

  it('returns false when given null', () => {
    expect(isEthersSigner(null as unknown as Signer | WalletClient)).toBe(false)
  })

  it('returns false when given a non-object type', () => {
    expect(isEthersSigner('not-an-object' as unknown as Signer | WalletClient)).toBe(false)
  })
})

describe('isEthersContract', () => {
  it('returns true for an Ethers Contract (no "abi" property)', () => {
    const mockEthersContract = {} as Contract
    expect(isEthersContract(mockEthersContract)).toBe(true)
  })

  it('returns false for a viem contract (has "abi" property)', () => {
    const mockViemContract = { abi: [] } as unknown as GetContractReturnType<Abi>
    expect(isEthersContract(mockViemContract)).toBe(false)
  })
})
