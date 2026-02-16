import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Organization } from '../entities/organization.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async onModuleInit() {
    const orgCount = await this.orgRepo.count();
    if (orgCount > 0) {
      this.logger.log('Database already seeded, skipping.');
      return;
    }

    this.logger.log('Seeding database...');

    // Create parent organization
    const parentOrg = this.orgRepo.create({
      name: 'Acme Corp',
      parentId: null,
    });
    await this.orgRepo.save(parentOrg);

    // Create child organization
    const childOrg = this.orgRepo.create({
      name: 'Acme Engineering',
      parentId: parentOrg.id,
    });
    await this.orgRepo.save(childOrg);

    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create Owner user (parent org)
    const owner = this.userRepo.create({
      email: 'owner@acme.com',
      password: hashedPassword,
      name: 'Alice Owner',
      role: 'owner',
      organizationId: parentOrg.id,
    });

    // Create Admin user (child org)
    const admin = this.userRepo.create({
      email: 'admin@acme.com',
      password: hashedPassword,
      name: 'Bob Admin',
      role: 'admin',
      organizationId: childOrg.id,
    });

    // Create Viewer user (child org)
    const viewer = this.userRepo.create({
      email: 'viewer@acme.com',
      password: hashedPassword,
      name: 'Carol Viewer',
      role: 'viewer',
      organizationId: childOrg.id,
    });

    await this.userRepo.save([owner, admin, viewer]);

    this.logger.log('Seeding complete.');
    this.logger.log('  Owner:  owner@acme.com  / password123');
    this.logger.log('  Admin:  admin@acme.com  / password123');
    this.logger.log('  Viewer: viewer@acme.com / password123');
  }
}
