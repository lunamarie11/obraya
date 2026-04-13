import { Controller, Get, Param, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('arquitecto/:userId')
  getArquitectoStats(@Param('userId') userId: string) {
    return this.dashboardService.getArquitectoStats(userId);
  }

  @Get('comercio')
  getComercioStats(@Query('period') period?: string) {
    return this.dashboardService.getComercioStats(period as any);
  }

  @Get('categories')
  getCategoryStats() {
    return this.dashboardService.getCategoryStats();
  }
}
