import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { jwtConstants } from './jwt.constants';
import { DatabaseModule } from '../database/database.module';
import { UsersRepository } from '../repositories/users.repository';
import { OrganizationsRepository } from '../repositories/organizations.repository';
import { SQLITE_CLOUD } from '../database/sqlitecloud.provider';

@Module({
  imports: [
    DatabaseModule,
    PassportModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: jwtConstants.secret,
        signOptions: { expiresIn: jwtConstants.expiresIn },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    {
      provide: UsersRepository,
      useFactory: (db) => new UsersRepository(db),
      inject: [SQLITE_CLOUD],
    },
    {
      provide: OrganizationsRepository,
      useFactory: (db) => new OrganizationsRepository(db),
      inject: [SQLITE_CLOUD],
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
