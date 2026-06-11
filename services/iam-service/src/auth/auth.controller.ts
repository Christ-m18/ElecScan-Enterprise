import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { z } from 'zod';
import { AuthService } from './auth.service.js';
import type { UserRole } from './user.repository.js';

const ROLES = [
  'superadmin',
  'tenant-admin',
  'site-manager',
  'operator',
  'analyst',
  'viewer',
] as const;

const SignupBody = z.object({
  tenantId: z.string().uuid(),
  email: z.string().email(),
  password: z.string().min(12).max(128),
  role: z.enum(ROLES).default('viewer'),
});

const LoginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128),
});

const RefreshBody = z.object({
  refreshToken: z.string().min(1),
});

const SetRoleBody = z.object({
  role: z.enum(ROLES),
});

@Controller('/auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}

  @Post('/signup')
  @HttpCode(201)
  async signup(@Body() body: unknown) {
    const parsed = SignupBody.parse(body);
    return this.auth.signup(parsed.tenantId, parsed.email, parsed.password, parsed.role);
  }

  @Post('/login')
  @HttpCode(200)
  async login(@Body() body: unknown) {
    const parsed = LoginBody.parse(body);
    return this.auth.login(parsed.email, parsed.password);
  }

  @Post('/refresh')
  @HttpCode(200)
  async refresh(@Body() body: unknown) {
    const parsed = RefreshBody.parse(body);
    return this.auth.refresh(parsed.refreshToken);
  }

  @Get('/me')
  async me(@Headers('authorization') auth: string) {
    const token = auth?.replace(/^Bearer\s+/i, '');
    if (!token) throw new NotFoundException('missing authorization header');
    return this.auth.me(token);
  }

  @Get('/users')
  async listUsers() {
    return this.auth.listUsers();
  }

  @Patch('/users/:id/role')
  async setRole(@Param('id') id: string, @Body() body: unknown) {
    const parsed = SetRoleBody.parse(body);
    const user = await this.auth.setRole(id, parsed.role as UserRole);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }
}
