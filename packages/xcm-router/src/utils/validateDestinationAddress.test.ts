import { describe, it, expect, vi, afterEach } from 'vitest';
import { validateDestinationAddress } from './validateDestinationAddress';
import { InvalidAddressError, type TNodeWithRelayChains } from '@paraspell/sdk';
import { ethers } from 'ethers';
import { isNodeEvm } from '@paraspell/sdk';

vi.mock('@paraspell/sdk', () => ({
  isNodeEvm: vi.fn(),
  InvalidAddressError: class InvalidAddressError extends Error {},
}));

vi.mock('ethers', () => ({
  ethers: {
    isAddress: vi.fn(),
  },
}));

describe('validateDestinationAddress', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should not throw an error when destination is EVM and address is a valid Ethereum address', () => {
    const address = '0x1234567890abcdef1234567890abcdef12345678';
    const destination: TNodeWithRelayChains = 'Moonbeam';

    vi.mocked(isNodeEvm).mockReturnValue(true);
    vi.spyOn(ethers, 'isAddress').mockReturnValue(true);

    expect(() => validateDestinationAddress(address, destination)).not.toThrow();
    expect(isNodeEvm).toHaveBeenCalledWith(destination);
    expect(ethers.isAddress).toHaveBeenCalledWith(address);
  });

  it('should throw an error when destination is EVM and address is not a valid Ethereum address', () => {
    const address = 'invalid-address';
    const destination: TNodeWithRelayChains = 'Moonbeam';

    vi.mocked(isNodeEvm).mockReturnValue(true);
    vi.spyOn(ethers, 'isAddress').mockReturnValue(false);

    expect(() => validateDestinationAddress(address, destination)).toThrow(InvalidAddressError);
    expect(() => validateDestinationAddress(address, destination)).toThrow(
      'Destination node is an EVM chain, but the address provided is not a valid Ethereum address.',
    );
    expect(isNodeEvm).toHaveBeenCalledWith(destination);
    expect(ethers.isAddress).toHaveBeenCalledWith(address);
  });

  it('should throw an error when destination is not EVM and address is a valid Ethereum address', () => {
    const address = '0x1234567890abcdef1234567890abcdef12345678';
    const destination: TNodeWithRelayChains = 'Acala';

    vi.mocked(isNodeEvm).mockReturnValue(false);
    vi.spyOn(ethers, 'isAddress').mockReturnValue(true);

    expect(() => validateDestinationAddress(address, destination)).toThrow(InvalidAddressError);
    expect(() => validateDestinationAddress(address, destination)).toThrow(
      'EVM address provided but destination is not an EVM chain.',
    );
    expect(isNodeEvm).toHaveBeenCalledWith(destination);
    expect(ethers.isAddress).toHaveBeenCalledWith(address);
  });

  it('should not throw an error when destination is not EVM and address is not a valid Ethereum address', () => {
    const address = 'some-non-ethereum-address';
    const destination: TNodeWithRelayChains = 'Acala';

    vi.mocked(isNodeEvm).mockReturnValue(false);
    vi.spyOn(ethers, 'isAddress').mockReturnValue(false);

    expect(() => validateDestinationAddress(address, destination)).not.toThrow();
    expect(isNodeEvm).toHaveBeenCalledWith(destination);
    expect(ethers.isAddress).toHaveBeenCalledWith(address);
  });
});
