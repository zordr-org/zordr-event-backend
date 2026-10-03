import { IsString, IsEmail, MinLength } from 'class-validator';

export class AdminLoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class AdminVerifyTwoFactorDto {
  @IsString()
  tempToken: string;

  @IsString()
  @MinLength(6)
  code: string;
}

export class AdminEnableTwoFactorDto {
  @IsString()
  @MinLength(6)
  code: string;
}

export class RefreshTokenDto {
  @IsString()
  refreshToken: string;
}