import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { z } from 'zod';
import { AuthService } from './auth.service.js';

const SignupBody = z.object({
  tenantId: z.string().uuid(),
  email: z.string().email(),
  password: z.string().min(12).max(128),
});

const LoginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128),
});

@Controller('/auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('/signup')
  @HttpCode(201)
  async signup(@Body() body: unknown): Promise<{ userId: string }> {
    const parsed = SignupBody.parse(body);
    return this.auth.signup(parsed.tenantId, parsed.email, parsed.password);
  }

  @Post('/login')
  @HttpCode(200)
  async login(@Body() body: unknown): Promise<{ accessToken: string; refreshToken: string }> {
    const parsed = LoginBody.parse(body);
    return this.auth.login(parsed.email, parsed.password);
  }
}
