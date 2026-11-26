import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type {
  NotificationChannel,
  NotificationStatus,
} from '@notification-platform/database';
import { CreateNotificationDto } from './dto/create-notification.dto.js';
import { NotificationsService } from './notifications.service.js';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(
    @Inject(NotificationsService)
    private readonly notificationsService: NotificationsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create and enqueue a notification for delivery' })
  create(@Body() dto: CreateNotificationDto) {
    return this.notificationsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List notifications with delivery attempts' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'channel', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Query('status') status?: NotificationStatus,
    @Query('channel') channel?: NotificationChannel,
    @Query('limit') limit?: string,
  ) {
    return this.notificationsService.findAll({
      status,
      channel,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get aggregated notification delivery metrics' })
  getStats() {
    return this.notificationsService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single notification by ID' })
  findOne(@Param('id') id: string) {
    return this.notificationsService.findOne(id);
  }

  @Post(':id/retry')
  @ApiOperation({ summary: 'Re-enqueue a notification for delivery' })
  retry(@Param('id') id: string) {
    return this.notificationsService.retry(id);
  }
}
