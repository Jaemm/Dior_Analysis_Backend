import { Controller, Get, HttpCode, HttpStatus, ServiceUnavailableException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
    constructor(private readonly healthService: HealthService) {}

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Service health check' })
    async getHealth() {
        const result = await this.healthService.check();

        if (result.status !== 'ok') {
            throw new ServiceUnavailableException(result);
        }

        return result;
    }
}
