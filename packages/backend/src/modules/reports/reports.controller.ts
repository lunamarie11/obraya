import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../users/guards/jwt-auth.guard';
import { RolesGuard } from '../users/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/company-user.entity';
import { IsOptional, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

class ReportQueryDto {
  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  to?: string;
}

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales')
  @ApiOperation({ summary: 'Exportar reporte de ventas a CSV' })
  @ApiQuery({ name: 'from', required: false, example: '2026-01-01' })
  @ApiQuery({ name: 'to', required: false, example: '2026-12-31' })
  @Roles(UserRole.ADMIN, UserRole.CONTABILIDAD, UserRole.VENDEDOR)
  async salesReport(
    @Query() query: ReportQueryDto,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const from = query.from ? new Date(query.from) : new Date(new Date().getFullYear(), 0, 1);
    const to = query.to ? new Date(query.to + 'T23:59:59') : new Date();

    const csv = await this.reportsService.salesReportCsv(user.companyId, from, to);
    const filename = `obraya-ventas-${from.toISOString().split('T')[0]}-al-${to.toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\uFEFF' + csv); // BOM para que Excel lo abra correctamente
  }

  @Get('stock')
  @ApiOperation({ summary: 'Exportar reporte de stock valorizado a CSV' })
  @Roles(UserRole.ADMIN, UserRole.CONTABILIDAD, UserRole.LOGISTICA)
  async stockReport(@CurrentUser() user: any, @Res() res: Response) {
    const csv = await this.reportsService.stockReportCsv(user.companyId);
    const date = new Date().toISOString().split('T')[0];
    const filename = `obraya-stock-${date}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\uFEFF' + csv);
  }
}
