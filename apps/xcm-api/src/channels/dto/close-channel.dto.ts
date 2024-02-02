import { IsNotEmpty, IsNumberString, IsString } from 'class-validator';

export class CloseChannelDto {
  @IsString()
  @IsNotEmpty()
  from: string;

  @IsNumberString()
  @IsNotEmpty()
  inbound: string;

  @IsNumberString()
  @IsNotEmpty()
  outbound: string;
}
