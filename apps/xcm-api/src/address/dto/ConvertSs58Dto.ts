import { IsNotEmpty } from 'class-validator';

export class ConvertSs58Dto {
  @IsNotEmpty()
  address: string;

  @IsNotEmpty()
  node: string;
}
