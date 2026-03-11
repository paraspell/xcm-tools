import { InvalidAddressError, isChainEvm, type TChain } from '@paraspell/sdk';
import { ethers } from 'ethers-v6';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { validateDestinationAddress } from './validateDestinationAddress';

vi.mock('@paraspell/sdk', () => ({
  isChainEvm: vi.fn(),
  InvalidAddressError: class InvalidAddressError extends Error {},
}));

vi.mock('ethers-v6');

describe('validateDestinationAddress', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should not throw an error when destination is EVM and address is a valid Ethereum address', () => {
    const address = '0x1234567890abcdef1234567890abcdef12345678';
    const destination: TChain = 'Moonbeam';

    vi.mocked(isChainEvm).mockReturnValue(true);
    vi.spyOn(ethers, 'isAddress').mockReturnValue(true);

    expect(() => validateDestinationAddress(address, destination)).not.toThrow();
    expect(isChainEvm).toHaveBeenCalledWith(destination);
    expect(ethers.isAddress).toHaveBeenCalledWith(address);
  });

  it('should throw an error when destination is EVM and address is not a valid Ethereum address', () => {
    const address = 'invalid-address';
    const destination: TChain = 'Moonbeam';

    vi.mocked(isChainEvm).mockReturnValue(true);
    vi.spyOn(ethers, 'isAddress').mockReturnValue(false);

    expect(() => validateDestinationAddress(address, destination)).toThrow(InvalidAddressError);
    expect(() => validateDestinationAddress(address, destination)).toThrow(
      'Destination chain is an EVM chain, but the address provided is not a valid Ethereum address.',
    );
    expect(isChainEvm).toHaveBeenCalledWith(destination);
    expect(ethers.isAddress).toHaveBeenCalledWith(address);
  });

  it('should throw an error when destination is not EVM and address is a valid Ethereum address', () => {
    const address = '0x1234567890abcdef1234567890abcdef12345678';
    const destination: TChain = 'Acala';

    vi.mocked(isChainEvm).mockReturnValue(false);
    vi.spyOn(ethers, 'isAddress').mockReturnValue(true);

    expect(() => validateDestinationAddress(address, destination)).toThrow(InvalidAddressError);
    expect(() => validateDestinationAddress(address, destination)).toThrow(
      'EVM address provided but destination is not an EVM chain.',
    );
    expect(isChainEvm).toHaveBeenCalledWith(destination);
    expect(ethers.isAddress).toHaveBeenCalledWith(address);
  });

  it('should not throw an error when destination is not EVM and address is not a valid Ethereum address', () => {
    const address = 'some-non-ethereum-address';
    const destination: TChain = 'Acala';

    vi.mocked(isChainEvm).mockReturnValue(false);
    vi.spyOn(ethers, 'isAddress').mockReturnValue(false);

    expect(() => validateDestinationAddress(address, destination)).not.toThrow();
    expect(isChainEvm).toHaveBeenCalledWith(destination);
    expect(ethers.isAddress).toHaveBeenCalledWith(address);
  });
});
