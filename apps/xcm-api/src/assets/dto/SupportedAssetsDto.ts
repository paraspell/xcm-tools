import { IsNotEmpty } from 'class-validator';

export class SupportedAssetsDto {
  @IsNotEmpty()
  origin: string;

  @IsNotEmpty()
  destination: string;
}
