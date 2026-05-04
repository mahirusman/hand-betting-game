import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller()
export class AppController {
  @Get('health')
  @ApiOkResponse({
    schema: {
      example: {
        success: true,
        data: { status: 'ok' },
        timestamp: '2026-01-01T00:00:00.000Z',
      },
    },
  })
  health(): { success: true; data: { status: 'ok' }; timestamp: string } {
    return {
      success: true,
      data: { status: 'ok' },
      timestamp: new Date().toISOString(),
    };
  }
}
