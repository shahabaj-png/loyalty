import { IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VerifyAgeDto {
  @ApiProperty({ description: 'User ID UUID' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Type of identity document (e.g. DRIVERS_LICENSE, PASSPORT)' })
  @IsString()
  documentType: string;

  @ApiPropertyOptional({ description: 'Document number' })
  @IsOptional()
  @IsString()
  documentNumber?: string;

  @ApiProperty({ description: 'Date of birth in YYYY-MM-DD format' })
  @IsDateString()
  dateOfBirth: string;
}
