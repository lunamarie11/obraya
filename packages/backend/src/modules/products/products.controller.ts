import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { JwtAuthGuard } from '../users/guards/jwt-auth.guard';
import { RolesGuard } from '../users/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/company-user.entity';

const imageStorage = { storage: memoryStorage() };

@ApiTags('products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar productos de la empresa (paginado)' })
  async findAll(@CurrentUser() user: any, @Query() query: ProductQueryDto) {
    return this.productsService.findAll(user.companyId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de producto' })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.productsService.findOne(id, user.companyId);
  }

  @Post()
  @ApiOperation({ summary: 'Crear producto' })
  @Roles(UserRole.ADMIN, UserRole.VENDEDOR)
  async create(@Body() dto: CreateProductDto, @CurrentUser() user: any) {
    return this.productsService.create(user.companyId, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar producto' })
  @Roles(UserRole.ADMIN, UserRole.VENDEDOR)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: any,
  ) {
    return this.productsService.update(id, user.companyId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Desactivar producto (soft delete)' })
  @Roles(UserRole.ADMIN, UserRole.VENDEDOR)
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    await this.productsService.remove(id, user.companyId);
  }

  @Post(':id/images')
  @ApiOperation({ summary: 'Subir imágenes del producto (máx 10)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { files: { type: 'array', items: { type: 'string', format: 'binary' } } } } })
  @Roles(UserRole.ADMIN, UserRole.VENDEDOR)
  @UseInterceptors(FilesInterceptor('files', 10, imageStorage))
  async uploadImages(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() user: any,
  ) {
    let product: any;
    for (const file of files) {
      product = await this.productsService.uploadImage(id, user.companyId, file);
    }
    return product;
  }

  @Post(':id/technical-sheet')
  @ApiOperation({ summary: 'Subir ficha técnica PDF' })
  @ApiConsumes('multipart/form-data')
  @Roles(UserRole.ADMIN, UserRole.VENDEDOR)
  @UseInterceptors(FileInterceptor('file', imageStorage))
  async uploadTechnicalSheet(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    return this.productsService.uploadTechnicalSheet(id, user.companyId, file);
  }

  @Post('import')
  @ApiOperation({ summary: 'Import masivo de productos via CSV' })
  @ApiConsumes('multipart/form-data')
  @Roles(UserRole.ADMIN, UserRole.VENDEDOR)
  @UseInterceptors(FileInterceptor('file', imageStorage))
  async importCsv(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: any) {
    return this.productsService.importFromCsv(user.companyId, file.buffer);
  }
}
