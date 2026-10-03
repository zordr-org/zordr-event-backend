import { IsOptional, IsString } from 'class-validator';

export class CreateOrganizerDto {
  @IsString()
  orgName: string;

  @IsString()
  orgType: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  city?: string;
}