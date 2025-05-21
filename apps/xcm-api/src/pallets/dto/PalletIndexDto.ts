import { IsNotEmpty, IsString } from 'class-validator';

export class PalletIndexDto {
  @IsNotEmpty()
  @IsString()
  pallet: string;
}
