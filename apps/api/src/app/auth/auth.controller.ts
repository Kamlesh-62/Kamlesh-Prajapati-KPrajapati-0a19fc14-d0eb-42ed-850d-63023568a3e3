import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginRequestDto } from './dto/login-request.dto';
import { RegisterRequestDto } from './dto/register-request.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  register(@Body() dto: RegisterRequestDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  login(@Body() dto: LoginRequestDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Get('csrf')
  csrf(@Req() req: Request) {
    const token =
      typeof (req as { csrfToken?: () => string }).csrfToken === 'function'
        ? (req as { csrfToken: () => string }).csrfToken()
        : null;
    return { csrfToken: token };
  }
}
