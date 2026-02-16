import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@kprajapati/data';
import { RegisterRequestDto } from './dto/register-request.dto';
import { UsersRepository } from '../repositories/users.repository';
import { OrganizationsRepository } from '../repositories/organizations.repository';
import { randomUUID } from 'crypto';

export interface JwtPayload {
  sub: string;
  role: string;
  organizationId: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersRepository,
    private readonly organizations: OrganizationsRepository,
    private readonly jwtService: JwtService
  ) {}

  async register(dto: RegisterRequestDto) {
    const orgExists = await this.organizations.existsById(dto.organizationId);
    if (!orgExists) {
      throw new BadRequestException('Organization not found');
    }

    const exists = await this.users.existsByEmail(dto.email);
    if (exists) {
      throw new BadRequestException('Email already in use');
    }

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.users.create({
      id: randomUUID(),
      email: dto.email,
      password: hashed,
      name: dto.name,
      role: Role.Viewer,
      organization_id: dto.organizationId,
    });

    return this.buildAuthResponse({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organization_id,
    });
  }

  async login(email: string, password: string) {
    const user = await this.users.findByEmail(email);
    const match = user ? await bcrypt.compare(password, user.password) : false;
    if (!user || !match) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.buildAuthResponse({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organization_id,
    });
  }

  private buildAuthResponse(user: {
    id: string;
    email: string;
    name: string;
    role: string;
    organizationId: string;
  }) {
    const payload: JwtPayload = {
      sub: user.id,
      role: user.role,
      organizationId: user.organizationId,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId,
      },
    };
  }
}
