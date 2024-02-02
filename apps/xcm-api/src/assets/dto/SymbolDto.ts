import { IsNotEmpty } from 'class-validator';

export class SymbolDto {
  @IsNotEmpty()
  symbol: string;
}
