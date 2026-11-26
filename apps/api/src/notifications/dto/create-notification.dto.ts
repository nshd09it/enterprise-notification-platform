import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export enum ChannelDto {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
  WEBHOOK = 'WEBHOOK',
}

export enum PriorityDto {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export class CreateNotificationDto {
  @ApiProperty({ enum: ChannelDto, example: ChannelDto.EMAIL })
  @IsEnum(ChannelDto)
  channel!: ChannelDto;

  @ApiProperty({ example: 'ops@example.com' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(320)
  recipient!: string;

  @ApiPropertyOptional({ example: 'Deployment Completed' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  subject?: string;

  @ApiProperty({ example: 'Release v2.4.0 has been deployed to production.' })
  @IsString()
  @IsNotEmpty()
  body!: string;

  @ApiPropertyOptional({ enum: PriorityDto, default: PriorityDto.NORMAL })
  @IsOptional()
  @IsEnum(PriorityDto)
  priority?: PriorityDto;

  @ApiPropertyOptional({ example: 'deploy-2026-11-25-001' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  idempotencyKey?: string;

  @ApiPropertyOptional({ example: { service: 'billing', env: 'prod' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
