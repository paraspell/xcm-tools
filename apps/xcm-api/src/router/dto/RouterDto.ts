import { IsNotEmpty, IsNumberString, IsOptional } from 'class-validator';

export class RouterDto {
  @IsNotEmpty()
  from: string;

  @IsOptional()
  exchange?: string;

  @IsNotEmpty()
  to: string;

  @IsNotEmpty()
  currencyFrom: string;

  @IsNotEmpty()
  currencyTo: string;

  @IsNotEmpty()
  recipientAddress: string;

  @IsNotEmpty()
  injectorAddress: string;

  @IsNotEmpty()
  @IsNumberString()
  amount: string;

  @IsOptional()
  slippagePct?: string;
}
