import {
  Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe,
  Post, Put, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUUID } from 'class-validator';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../users/guards/jwt-auth.guard';
import { SuperAdminGuard } from './guards/super-admin.guard';
import { CompanyStatus } from '../users/entities/company.entity';
import { UserRole } from '../users/entities/company-user.entity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

class UpdateCompanyStatusDto {
  @IsEnum(CompanyStatus)
  status: CompanyStatus;
}

class UpdateUserDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

class CreateSponsoredBannerDto {
  @IsUUID()
  companyId: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  ctaLabel?: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsInt()
  priority?: number;
}

class UpdateSponsoredBannerDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  ctaLabel?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  priority?: number;
}

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ── Stats ────────────────────────────────────────────────────────────────

  @Get('stats')
  @ApiOperation({ summary: 'KPIs globales de la plataforma' })
  getStats() {
    return this.adminService.getStats();
  }

  // ── Companies ────────────────────────────────────────────────────────────

  @Get('companies')
  listCompanies(@Query('status') status?: CompanyStatus) {
    return this.adminService.listCompanies(status);
  }

  @Get('companies/:id')
  getCompany(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getCompanyDetail(id);
  }

  @Put('companies/:id/status')
  updateCompanyStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCompanyStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.adminService.updateCompanyStatus(
      id,
      dto.status,
      `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
    );
  }

  @Delete('companies/:id')
  @HttpCode(204)
  deleteCompany(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.deleteCompany(id);
  }

  // ── Users ────────────────────────────────────────────────────────────────

  @Get('users')
  listUsers(@Query('search') search?: string) {
    return this.adminService.listUsers(search);
  }

  @Put('users/:id')
  updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.adminService.updateUser(id, dto);
  }

  @Delete('users/:id')
  @HttpCode(204)
  deleteUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.deleteUser(id);
  }

  // ── Orders ───────────────────────────────────────────────────────────────

  @Get('orders')
  listOrders(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.listOrders({ status, search, page, limit });
  }

  @Delete('orders/:id')
  @HttpCode(204)
  deleteOrder(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.deleteOrder(id);
  }

  // ── Products ─────────────────────────────────────────────────────────────

  @Get('products')
  listProducts(
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.listProducts({ search, page, limit });
  }

  @Put('products/:id/toggle')
  toggleProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.adminService.toggleProduct(id, isActive);
  }

  @Delete('products/:id')
  @HttpCode(204)
  deleteProduct(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.deleteProduct(id);
  }

  // ── Búsqueda ─────────────────────────────────────────────────────────────

  @Post('search/reindex')
  @ApiOperation({ summary: 'Reindexa todos los productos en Elasticsearch (ver ADR-007)' })
  reindexSearch() {
    return this.adminService.reindexSearch();
  }

  // ── Banners publicitarios pagos (ver ADR-021) ───────────────────────────

  @Get('sponsored-banners')
  listSponsoredBanners() {
    return this.adminService.listSponsoredBanners();
  }

  @Post('sponsored-banners')
  createSponsoredBanner(@Body() dto: CreateSponsoredBannerDto) {
    return this.adminService.createSponsoredBanner({
      ...dto,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
    });
  }

  @Put('sponsored-banners/:id')
  updateSponsoredBanner(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSponsoredBannerDto) {
    return this.adminService.updateSponsoredBanner(id, {
      ...dto,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
    });
  }

  @Delete('sponsored-banners/:id')
  @HttpCode(204)
  deleteSponsoredBanner(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.deleteSponsoredBanner(id);
  }
}
