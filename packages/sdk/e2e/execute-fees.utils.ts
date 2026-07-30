import type { TChain, TLocation } from '@paraspell/sdk-core'
import { expect } from 'vitest'

import { Builder, isChainEvm, Version, type TPapiTransaction } from '../src'

type TInstructionNode = {
  type: string
  value?: unknown
}

type TDecodedCall = {
  type: string
  value: {
    type: string
    value: {
      message?: unknown
    }
  }
}

export type TExecutionVersion = 'V3' | 'V4' | 'V5'

export type TExecuteE2eCase = {
  name: string
  build: () => Promise<TPapiTransaction>
  expectRelayFeeAsset?: boolean
  minFeeInstructions: number
  minRefunds?: number
}

export const TEST_ADDRESS = '1phKfRLnZm8iWTq5ki2xAPf5uwxjBrEe6Bc3Tw2bxPLx3t8'
export const EVM_TEST_ADDRESS = '0x1501C1413e4178c38567Ada8945A80351F7B8496'

export const USDT_LOCATION: TLocation = {
  parents: 1,
  interior: {
    X3: [{ Parachain: 1000 }, { PalletInstance: 50 }, { GeneralIndex: 1984 }]
  }
}

export const DOT_LOCATION: TLocation = {
  parents: 1,
  interior: 'Here'
}

export const HDX_LOCATION: TLocation = {
  parents: 1,
  interior: {
    X2: [{ Parachain: 2034 }, { GeneralIndex: 0 }]
  }
}

const TRANSFER_DESTINATIONS: TChain[] = [
  'AssetHubPolkadot',
  'Hydration',
  'Moonbeam',
  'BifrostPolkadot',
  'Acala'
]

export const createExecuteTransferCases = (
  version: Version,
  additionalDestinations: TChain[] = []
): TExecuteE2eCase[] => {
  const destinations = [...TRANSFER_DESTINATIONS, ...additionalDestinations]

  return (['AssetHubPolkadot', 'Hydration'] as const).flatMap(origin =>
    destinations
      .filter(destination => destination !== origin)
      .flatMap(destination =>
        [
          { amount: 100, separateFeeAsset: false },
          { amount: 100, separateFeeAsset: true },
          { amount: 250, separateFeeAsset: false }
        ].map(({ amount, separateFeeAsset }) => {
          const routedThroughReserve = origin === 'Hydration' && destination !== 'AssetHubPolkadot'
          const minFeeInstructions = 1 + Number(routedThroughReserve) + Number(separateFeeAsset)
          const recipient = isChainEvm(destination) ? EVM_TEST_ADDRESS : TEST_ADDRESS
          const feeAsset = separateFeeAsset
            ? { location: DOT_LOCATION }
            : { location: USDT_LOCATION }

          return {
            name: `${origin} to ${destination} with ${separateFeeAsset ? 'a separate DOT fee asset' : 'the transferred asset paying fees'} at ${amount} units`,
            expectRelayFeeAsset: separateFeeAsset,
            minFeeInstructions,
            build: () =>
              Builder({ xcmFormatCheck: true })
                .from(origin)
                .to(destination)
                .currency({ location: USDT_LOCATION, amount })
                .feeAsset(feeAsset)
                .xcmVersion(version)
                .sender(TEST_ADDRESS)
                .recipient(recipient)
                .build()
          }
        })
      )
  )
}

const asInstructionNode = (value: unknown): TInstructionNode | undefined => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return undefined

  const type = (value as { type?: unknown }).type
  return typeof type === 'string' ? { ...(value as object), type } : undefined
}

const collectInstructionNodes = (
  value: unknown,
  instructionType: string,
  nodes: TInstructionNode[] = []
) => {
  const instruction = asInstructionNode(value)
  if (instruction?.type === instructionType) nodes.push(instruction)

  if (Array.isArray(value)) {
    for (const child of value) collectInstructionNodes(child, instructionType, nodes)
  } else if (typeof value === 'object' && value !== null) {
    for (const child of Object.values(value)) {
      collectInstructionNodes(child, instructionType, nodes)
    }
  }

  return nodes
}

const collectInstructionLists = (value: unknown, lists: string[][] = []) => {
  if (Array.isArray(value)) {
    const instructionTypes = value
      .map(asInstructionNode)
      .filter((instruction): instruction is TInstructionNode => instruction !== undefined)
      .map(instruction => instruction.type)

    if (instructionTypes.length > 0) lists.push(instructionTypes)
    for (const child of value) collectInstructionLists(child, lists)
  } else if (typeof value === 'object' && value !== null) {
    for (const child of Object.values(value)) collectInstructionLists(child, lists)
  }

  return lists
}

const collectRefundLocations = (
  value: unknown,
  insideAppendix = false,
  locations: boolean[] = []
) => {
  const instruction = asInstructionNode(value)
  if (instruction?.type === 'RefundSurplus') locations.push(insideAppendix)

  const childInsideAppendix = insideAppendix || instruction?.type === 'SetAppendix'

  if (Array.isArray(value)) {
    for (const child of value) collectRefundLocations(child, childInsideAppendix, locations)
  } else if (typeof value === 'object' && value !== null) {
    for (const child of Object.values(value)) {
      collectRefundLocations(child, childInsideAppendix, locations)
    }
  }

  return locations
}

const getFeeAsset = (instruction: TInstructionNode, assetKey: 'asset' | 'fees') => {
  if (typeof instruction.value !== 'object' || instruction.value === null) return undefined

  const asset = (instruction.value as Record<string, unknown>)[assetKey]
  return typeof asset === 'object' && asset !== null ? asset : undefined
}

const getFeeAmount = (instruction: TInstructionNode, assetKey: 'asset' | 'fees') => {
  const asset = getFeeAsset(instruction, assetKey)
  if (!asset) return undefined

  const fun = (asset as Record<string, unknown>).fun
  if (typeof fun !== 'object' || fun === null) return undefined

  const fungible = asInstructionNode(fun)
  return fungible?.type === 'Fungible' && typeof fungible.value === 'bigint'
    ? fungible.value
    : undefined
}

const isRelayFeeAsset = (instruction: TInstructionNode, assetKey: 'asset' | 'fees') => {
  const asset = getFeeAsset(instruction, assetKey)
  if (!asset) return false

  const id = (asset as Record<string, unknown>).id
  if (typeof id !== 'object' || id === null) return false

  const location = id as Record<string, unknown>
  return location.parents === 1 && asInstructionNode(location.interior)?.type === 'Here'
}

const getMessage = (tx: TPapiTransaction, version: TExecutionVersion) => {
  const call = tx.decodedCall as unknown as TDecodedCall
  expect(call.type).toBe('PolkadotXcm')
  expect(call.value.type).toBe('execute')

  const message = asInstructionNode(call.value.value.message)
  expect(message?.type).toBe(version)
  return message?.value
}

export const expectPayFeesProgram = (
  tx: TPapiTransaction,
  minFeeInstructions: number,
  minRefunds = minFeeInstructions,
  expectRelayFeeAsset = false
) => {
  const message = getMessage(tx, 'V5')
  const payFees = collectInstructionNodes(message, 'PayFees')
  const buyExecution = collectInstructionNodes(message, 'BuyExecution')
  const appendices = collectInstructionNodes(message, 'SetAppendix')
  const refunds = collectInstructionNodes(message, 'RefundSurplus')
  const instructionLists = collectInstructionLists(message)

  expect(payFees.length, JSON.stringify(instructionLists)).toBeGreaterThanOrEqual(
    minFeeInstructions
  )
  expect(buyExecution).toHaveLength(0)
  expect(appendices.length).toBeGreaterThanOrEqual(minRefunds)
  expect(refunds.length).toBeGreaterThanOrEqual(minRefunds)
  expect(
    payFees
      .map(instruction => getFeeAmount(instruction, 'asset'))
      .every(amount => amount !== undefined && amount > 0n)
  ).toBe(true)
  if (expectRelayFeeAsset)
    expect(payFees.some(instruction => isRelayFeeAsset(instruction, 'asset'))).toBe(true)
  expect(collectRefundLocations(message).every(Boolean)).toBe(true)

  for (const instructionTypes of instructionLists) {
    for (let index = 0; index < instructionTypes.length; index += 1) {
      if (instructionTypes[index] === 'PayFees') {
        expect(instructionTypes[index + 1]).toBe('SetAppendix')
      }
    }
  }

  for (const appendix of appendices) {
    if (!Array.isArray(appendix.value)) continue

    const instructionTypes = appendix.value
      .map(asInstructionNode)
      .filter((instruction): instruction is TInstructionNode => instruction !== undefined)
      .map(instruction => instruction.type)
    const refundIndex = instructionTypes.indexOf('RefundSurplus')
    const depositIndex = instructionTypes.indexOf('DepositAsset')

    expect(refundIndex).toBeGreaterThanOrEqual(0)
    if (depositIndex !== -1) expect(refundIndex).toBeLessThan(depositIndex)
  }
}

export const expectBuyExecutionProgram = (
  tx: TPapiTransaction,
  minFeeInstructions: number,
  expectRelayFeeAsset = false,
  version: Exclude<TExecutionVersion, 'V5'> = 'V4'
) => {
  const message = getMessage(tx, version)
  const payFees = collectInstructionNodes(message, 'PayFees')
  const buyExecution = collectInstructionNodes(message, 'BuyExecution')
  const refunds = collectInstructionNodes(message, 'RefundSurplus')

  expect(buyExecution.length).toBeGreaterThanOrEqual(minFeeInstructions)
  expect(payFees).toHaveLength(0)
  expect(refunds).toHaveLength(0)
  expect(
    buyExecution
      .map(instruction => getFeeAmount(instruction, 'fees'))
      .every(amount => amount !== undefined && amount > 0n)
  ).toBe(true)
  if (expectRelayFeeAsset) {
    expect(buyExecution.some(instruction => isRelayFeeAsset(instruction, 'fees'))).toBe(true)
  }
}

export const expectVersionedExecutionProgram = (tx: TPapiTransaction): TExecutionVersion => {
  const call = tx.decodedCall as unknown as TDecodedCall
  expect(call.type).toBe('PolkadotXcm')
  expect(call.value.type).toBe('execute')

  const version = asInstructionNode(call.value.value.message)?.type

  if (version === 'V5') {
    expectPayFeesProgram(tx, 1)
    return version
  }

  if (version === 'V3' || version === 'V4') {
    expectBuyExecutionProgram(tx, 1, false, version)
    return version
  }

  throw new Error(`Unsupported execute XCM version ${String(version)}`)
}
