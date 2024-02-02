import { IsNotEmpty, IsNumberString } from 'class-validator';

export class XTransferDto {
  from?: string;
  to?: string;

  @IsNotEmpty()
  @IsNumberString()
  amount: number;

  @IsNotEmpty()
  address: string;

  currency?: string;
}
