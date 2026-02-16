import { IsEmail, IsString, MinLength, IsUUID } from 'class-validator';

export class RegisterRequestDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsUUID()
  organizationId!: string;
}
