import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateOrganizationDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsUUID()
  parentId?: string | null;
}
