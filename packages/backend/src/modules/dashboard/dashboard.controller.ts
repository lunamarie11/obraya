import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DashboardService, Period } from './dashboard.service';
import { JwtAuthGuard } from '../users/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'KPIs del período: ventas, ticket medio, top productos, alertas de stock' })
  @ApiQuery({ name: 'period', enum: ['today', 'week', 'month'], required: false })
  async getSummary(@CurrentUser() user: any, @Query('period') period: Period = 'month') {
    return this.dashboardService.getSummary(user.companyId, period);
  }
}
