import {
  IsEnum,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { TransactionType } from '@paraspell/xcm-router';

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

  @IsOptional()
  evmInjectorAddress?: string;

  @IsNotEmpty()
  @IsNumberString()
  amount: string;

  @IsOptional()
  slippagePct?: string;

  @IsOptional()
  @Transform(({ value }) => ('' + value).toUpperCase())
  @IsEnum(TransactionType)
  type?: TransactionType;
}
