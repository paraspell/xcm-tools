import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createTransactInstructions } from '../../../pallets/polkadotXcm'
import type { TCreateTransferXcmOptions } from '../../../types'
import { addXcmVersionHeader } from '../../xcm-version'
import { createBaseExecuteXcm } from './createBaseExecuteXcm'
import { createDirectExecuteXcm } from './createExecuteXcm'
import { prepareCommonExecuteXcm } from './prepareCommonExecuteXcm'

vi.mock('../../../pallets/polkadotXcm')
vi.mock('../../xcm-version')
vi.mock('./createBaseExecuteXcm')
vi.mock('./prepareCommonExecuteXcm')

describe('createDirectExecuteXcm', () => {
  const prefix = ['prefix'] as unknown as ReturnType<typeof prepareCommonExecuteXcm>['prefix']
  const depositInstruction = 'deposit' as unknown as ReturnType<
    typeof prepareCommonExecuteXcm
  >['depositInstruction']

  const baseOptions = {
    version: Version.V5,
    destChain: 'Polkadot',
    recipientAddress: '5FRecipient'
  } as TCreateTransferXcmOptions<unknown, unknown>

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates XCM without transact instructions when call is missing', async () => {
    const baseXcm = ['base-xcm']
    const versionedXcm = ['versioned-xcm']

    vi.mocked(prepareCommonExecuteXcm).mockReturnValue({
      prefix,
      depositInstruction
    })

    vi.mocked(createBaseExecuteXcm).mockReturnValue(baseXcm)

    vi.mocked(addXcmVersionHeader).mockReturnValue(versionedXcm)

    const result = await createDirectExecuteXcm(baseOptions)

    expect(createTransactInstructions).not.toHaveBeenCalled()

    expect(createBaseExecuteXcm).toHaveBeenCalledWith({
      ...baseOptions,
      suffixXcm: [depositInstruction]
    })

    expect(addXcmVersionHeader).toHaveBeenCalledWith([...prefix, ...baseXcm], baseOptions.version)

    expect(result).toEqual(versionedXcm)
  })

  it('creates XCM with transact instructions when call exists', async () => {
    const transactInstructions = ['transact-1', 'transact-2'] as unknown as Awaited<
      ReturnType<typeof createTransactInstructions>
    >
    const baseXcm = ['base-xcm']
    const versionedXcm = ['versioned-xcm']

    const options = {
      ...baseOptions,
      transactOptions: {
        call: '0x1234'
      }
    } as TCreateTransferXcmOptions<unknown, unknown>

    vi.mocked(prepareCommonExecuteXcm).mockReturnValue({
      prefix,
      depositInstruction
    })

    vi.mocked(createTransactInstructions).mockResolvedValue(transactInstructions)

    vi.mocked(createBaseExecuteXcm).mockReturnValue(baseXcm)

    vi.mocked(addXcmVersionHeader).mockReturnValue(versionedXcm)

    const result = await createDirectExecuteXcm(options)

    expect(createTransactInstructions).toHaveBeenCalledWith(
      undefined,
      options.transactOptions,
      options.version,
      options.destChain,
      options.recipientAddress
    )

    expect(createBaseExecuteXcm).toHaveBeenCalledWith({
      ...options,
      suffixXcm: [...transactInstructions, depositInstruction]
    })

    expect(addXcmVersionHeader).toHaveBeenCalledWith([...prefix, ...baseXcm], options.version)

    expect(result).toEqual(versionedXcm)
  })
})
