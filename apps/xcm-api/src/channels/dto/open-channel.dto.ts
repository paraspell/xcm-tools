import { IsNotEmpty, IsNumberString, IsString } from 'class-validator';

export class OpenChannelDto {
  @IsString()
  @IsNotEmpty()
  from: string;

  @IsString()
  @IsNotEmpty()
  to: string;

  @IsNumberString()
  @IsNotEmpty()
  maxSize: string;

  @IsNumberString()
  @IsNotEmpty()
  maxMessageSize: string;
}
