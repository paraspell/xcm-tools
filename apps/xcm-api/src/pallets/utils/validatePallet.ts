import { BadRequestException } from '@nestjs/common';
import { SUPPORTED_PALLETS, type TPallet } from '@paraspell/sdk';

export const validatePallet = (pallet: string): TPallet => {
  if (!SUPPORTED_PALLETS.includes(pallet as TPallet)) {
    throw new BadRequestException(
      `Invalid pallet: ${pallet}. Check docs for valid pallets.`,
    );
  }

  return pallet as TPallet;
};
