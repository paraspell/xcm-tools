import type { TAssetInfoWithId } from '@paraspell/assets'
import { InvalidCurrencyError, type TAssetInfo } from '@paraspell/assets'
import type { TChain, TLocation, TSubstrateChain } from '@paraspell/sdk-common'
import { isExternalChain, isTLocation, replaceBigInt } from '@paraspell/sdk-common'
import type { WalletClient } from 'viem'

import {
  ExtensionNotInstalledError,
  InvalidAddressError,
  MissingParameterError,
  UnsupportedOperationError
} from '../errors'
import type { TAddress, TDestination, TSender, TSwapOptions } from '../types'
import { isViemSigner } from './guards'

export const assertToIsString: (
  to: TDestination,
  overrideMsg?: string
) => asserts to is Exclude<TDestination, TLocation> = (to, overrideMsg) => {
  if (isTLocation(to)) {
    throw new InvalidAddressError(
      overrideMsg ?? 'Location destination is not supported for XCM fee calculation.'
    )
  }
}

export const assertAddressIsString: (
  address: TAddress
) => asserts address is Exclude<TAddress, TLocation> = address => {
  if (isTLocation(address)) {
    throw new InvalidAddressError('Location address is not supported for this transfer type.')
  }
}

export const assertSender: (address: string | undefined) => asserts address is string = address => {
  if (!address) {
    throw new MissingParameterError('sender')
  }
}

export const assertHasId: (asset: TAssetInfo) => asserts asset is TAssetInfoWithId = asset => {
  if (asset.assetId === undefined) {
    throw new InvalidCurrencyError(`Asset ${JSON.stringify(asset, replaceBigInt)} has no assetId`)
  }
}

export const assertSenderSource: <TSigner>(
  sender?: TSender<TSigner>
) => asserts sender is TSender<TSigner> = <TSigner>(sender?: TSender<TSigner>) => {
  if (sender === undefined) {
    throw new InvalidAddressError(
      'Sender address needs to be a derivation path or signer to sign and submit transaction using this method.'
    )
  }
}

export const isSenderSigner = <TSigner>(sender: TSender<TSigner>): sender is TSigner => {
  return typeof sender !== 'string'
}

export const assertSwapSupport = <TApi, TRes, TSigner>(
  options: TSwapOptions<TApi, TRes, TSigner> | undefined
) => {
  if (options) {
    throw new UnsupportedOperationError(
      'Swap options are not supported by this operation. Please open an issue if you would like to see this supported.'
    )
  }
}

const evmTransferUnsupportedMessage = (origin: TChain): string =>
  `This operation is not supported for EVM transfers (origin '${origin}'). Call .signAndSubmit() with your viem WalletClient instead.`

export const assertSubstrateOrigin: (chain: TChain) => asserts chain is TSubstrateChain = chain => {
  if (isExternalChain(chain)) {
    throw new UnsupportedOperationError(evmTransferUnsupportedMessage(chain))
  }
}

export const assertNotEvmTransfer: <TSigner>(
  from: TChain,
  senderSource?: TSender<TSigner> | WalletClient
) => asserts from is TSubstrateChain = (from, senderSource) => {
  assertSubstrateOrigin(from)
  if (isViemSigner(senderSource)) {
    throw new UnsupportedOperationError(evmTransferUnsupportedMessage(from))
  }
}

export const assertExtensionInstalled: <T>(
  extension: T | undefined,
  extensionName: string,
  packageName: string,
  usage: string
) => asserts extension is T = (extension, extensionName, packageName, usage) => {
  if (!extension) {
    throw new ExtensionNotInstalledError(
      `The ${extensionName} extension is not registered. Please install ${packageName} and import it before ${usage}.`
    )
  }
}
