import { Controller, Get, Post, Body, Param, Patch, Delete, Query } from '@nestjs/common';
import { ProjectsService } from './projects.service';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  findAll(@Query('ownerId') ownerId?: string) {
    return this.projectsService.findAll(ownerId);
  }

  @Get('stats/:ownerId')
  getStats(@Param('ownerId') ownerId: string) {
    return this.projectsService.getStats(ownerId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Post()
  create(@Body() body: {
    name: string; type: string; area?: string; location?: string;
    budget: number; startDate: Date; endDate: Date; ownerId: string;
  }) {
    return this.projectsService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.projectsService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }
}
