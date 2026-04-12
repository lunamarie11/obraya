import { Controller, Get, Patch, Param, Body, Post } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: { name?: string; phone?: string; cuit?: string; isPro?: boolean },
  ) {
    return this.usersService.update(id, body);
  }

  @Get(':id/addresses')
  getAddresses(@Param('id') id: string) {
    return this.usersService.getAddresses(id);
  }

  @Post(':id/addresses')
  addAddress(
    @Param('id') id: string,
    @Body() body: { label: string; street: string; city: string; province: string; zipCode: string; isDefault?: boolean },
  ) {
    return this.usersService.addAddress(id, body);
  }
}
