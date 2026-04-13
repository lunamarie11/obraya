import { Controller, Get, Post, Body, Param, Delete, Query } from '@nestjs/common';
import { ExpensesService } from './expenses.service';

@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  findByProject(@Query('projectId') projectId: string) {
    return this.expensesService.findByProject(projectId);
  }

  @Get('summary/:projectId')
  getSummary(@Param('projectId') projectId: string) {
    return this.expensesService.getSummary(projectId);
  }

  @Post()
  create(@Body() body: {
    projectId: string; concept: string; category: string;
    amount: number; registeredBy?: string; date?: Date;
  }) {
    return this.expensesService.create(body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.expensesService.remove(id);
  }
}
