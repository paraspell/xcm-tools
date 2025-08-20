import { BadRequestException } from '@nestjs/common';
import { PALLETS, type TPallet } from '@paraspell/sdk';

export const validatePallet = (pallet: string): TPallet => {
  if (!PALLETS.includes(pallet as TPallet)) {
    throw new BadRequestException(
      `Invalid pallet: ${pallet}. Check docs for valid pallets.`,
    );
  }

  return pallet as TPallet;
};
