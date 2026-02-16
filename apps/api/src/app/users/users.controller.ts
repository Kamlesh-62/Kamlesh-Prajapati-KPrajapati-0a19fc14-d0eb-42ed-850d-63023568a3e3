import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { Permission } from '@kprajapati/auth';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { AuthUser } from '../auth/interfaces/auth-user.interface';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @Permissions(Permission.CreateTask)
  list(
    @Req() req: Request,
    @Query('page') pageRaw?: string,
    @Query('limit') limitRaw?: string,
    @Query('search') search?: string,
    @Query('orgId') orgId?: string
  ) {
    const page = Math.max(Number(pageRaw ?? 1), 1);
    const limit = Math.min(Math.max(Number(limitRaw ?? 50), 1), 200);
    return this.users.list(req.user as AuthUser, { page, limit, search, orgId });
  }
}
