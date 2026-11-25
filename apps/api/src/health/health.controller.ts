
import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('api/v1/health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Check API health' })
  getHealth() {
    return {
      status: 'ok',
      service: 'notification-api',
      timestamp: new Date().toISOString(),
    };
  }
}
