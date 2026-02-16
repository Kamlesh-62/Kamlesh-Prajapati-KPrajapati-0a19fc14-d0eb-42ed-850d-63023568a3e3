import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { Permission } from '@kprajapati/auth';
import { TasksService } from './tasks.service';
import { CreateTaskRequestDto } from './dto/create-task.dto';
import { UpdateTaskRequestDto } from './dto/update-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { AuthUser } from '../auth/interfaces/auth-user.interface';

@Controller('tasks')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @Permissions(Permission.ReadTask)
  list(
    @Req() req: Request,
    @Query('page') pageRaw?: string,
    @Query('limit') limitRaw?: string,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('assigneeId') assigneeId?: string,
    @Query('priority') priority?: string,
    @Query('search') search?: string,
    @Query('sort') sort?: 'none' | 'overdue_first' | 'due_soon'
  ) {
    const page = Math.max(Number(pageRaw ?? 1), 1);
    const limit = Math.min(Math.max(Number(limitRaw ?? 50), 1), 200);
    return this.tasksService.list(req.user as AuthUser, {
      page,
      limit,
      status,
      category,
      assigneeId,
      priority,
      search,
      sort,
    });
  }

  @Post()
  @Permissions(Permission.CreateTask)
  create(@Req() req: Request, @Body() dto: CreateTaskRequestDto) {
    return this.tasksService.create(req.user as AuthUser, dto);
  }

  @Put(':id')
  @Permissions(Permission.UpdateTask)
  update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateTaskRequestDto
  ) {
    return this.tasksService.update(req.user as AuthUser, id, dto);
  }

  @Delete(':id')
  @Permissions(Permission.DeleteTask)
  remove(@Req() req: Request, @Param('id') id: string) {
    return this.tasksService.remove(req.user as AuthUser, id);
  }
}
