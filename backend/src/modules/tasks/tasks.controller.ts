import { Controller, Get, Post, Body, Param, Patch, Delete, Query } from '@nestjs/common';
import { TasksService } from './tasks.service';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  findByProject(@Query('projectId') projectId: string) {
    return this.tasksService.findByProject(projectId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @Post()
  create(@Body() body: {
    title: string; projectId: string; priority?: string;
    assignedTo?: string; dueDate?: Date;
  }) {
    return this.tasksService.create(body as any);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.tasksService.update(id, body);
  }

  @Patch(':id/move')
  move(@Param('id') id: string, @Body('status') status: string) {
    return this.tasksService.moveToColumn(id, status as any);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tasksService.remove(id);
  }
}
