import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { StockService } from './stock.service';
import { UpdateStockDto, BulkUpdateStockItemDto } from './dto/update-stock.dto';
import { JwtAuthGuard } from '../users/guards/jwt-auth.guard';
import { RolesGuard } from '../users/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/company-user.entity';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class BulkUpdateBodyDto {
  @ApiProperty({ type: [BulkUpdateStockItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkUpdateStockItemDto)
  items: BulkUpdateStockItemDto[];
}

@ApiTags('stock')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get()
  @ApiOperation({ summary: 'Stock actual de todos los productos de la empresa' })
  async findAll(@CurrentUser() user: any) {
    return this.stockService.findByCompany(user.companyId);
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Productos con bajo stock (debajo del mínimo configurado)' })
  async getLowStock(@CurrentUser() user: any) {
    return this.stockService.findLowStock(user.companyId);
  }

  @Get(':productId')
  @ApiOperation({ summary: 'Stock de un producto por depósito' })
  async findByProduct(
    @Param('productId', ParseUUIDPipe) productId: string,
    @CurrentUser() user: any,
  ) {
    return this.stockService.findByProduct(productId, user.companyId);
  }

  @Get(':productId/movements')
  @ApiOperation({ summary: 'Historial de movimientos de stock de un producto' })
  async getMovements(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Query('limit') limit: number = 50,
    @CurrentUser() user: any,
  ) {
    return this.stockService.getMovements(productId, user.companyId, limit);
  }

  @Put(':productId')
  @ApiOperation({ summary: 'Actualizar stock de un producto' })
  @Roles(UserRole.ADMIN, UserRole.VENDEDOR, UserRole.LOGISTICA)
  async update(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: UpdateStockDto,
    @CurrentUser() user: any,
  ) {
    return this.stockService.updateStock(productId, user.companyId, dto, user.id);
  }

  @Post('bulk-update')
  @ApiOperation({ summary: 'Actualización masiva de stock (JSON)' })
  @Roles(UserRole.ADMIN, UserRole.VENDEDOR, UserRole.LOGISTICA)
  async bulkUpdate(@Body() body: BulkUpdateBodyDto, @CurrentUser() user: any) {
    return this.stockService.bulkUpdate(user.companyId, body.items, user.id);
  }

  @Post('bulk-update/csv')
  @ApiOperation({ summary: 'Actualización masiva de stock via CSV' })
  @ApiConsumes('multipart/form-data')
  @Roles(UserRole.ADMIN, UserRole.VENDEDOR, UserRole.LOGISTICA)
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async bulkUpdateFromCsv(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: any) {
    return this.stockService.bulkUpdateFromCsv(user.companyId, file.buffer, user.id);
  }
}
