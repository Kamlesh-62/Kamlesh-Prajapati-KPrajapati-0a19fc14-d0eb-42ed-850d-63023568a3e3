import { Body, Controller, Get, Post } from '@nestjs/common';
import { OrganizationsRepository } from '../repositories/organizations.repository';
import { CreateOrganizationDto } from './dto/create-organization.dto';

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizations: OrganizationsRepository) {}

  @Get()
  list() {
    return this.organizations.listAll();
  }

  @Post()
  create(@Body() dto: CreateOrganizationDto) {
    return this.organizations.create(dto.name, dto.parentId ?? null);
  }
}
