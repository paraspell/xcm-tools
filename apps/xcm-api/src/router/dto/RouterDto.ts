import { TNodeWithRelayChains } from '@paraspell/sdk';
import { TExchangeNode } from '@paraspell/xcm-router';
import { IsNotEmpty, IsNumberString, IsOptional } from 'class-validator';

export class RouterDto {
  @IsNotEmpty()
  from: TNodeWithRelayChains;

  @IsOptional()
  exchange?: TExchangeNode;

  @IsNotEmpty()
  to: TNodeWithRelayChains;

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
