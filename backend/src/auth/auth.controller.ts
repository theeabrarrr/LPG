import { Controller, Get, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SetupOwnerDto } from './dto/setup-owner.dto';
import { LoginDto } from './dto/login.dto';
import { PinLoginDto } from './dto/pin-login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** Check if first-time setup is needed */
  @Get('status')
  async getStatus() {
    return this.authService.getSystemStatus();
  }

  /** List all tenants (for tenant picker) */
  @Get('tenants')
  async getTenants() {
    return this.authService.getTenants();
  }

  /** First-time company + owner setup */
  @Post('setup')
  @HttpCode(HttpStatus.CREATED)
  async setup(@Body() dto: SetupOwnerDto) {
    return this.authService.setupOwner(dto);
  }

  /** Web login: email + password */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /** Mobile PIN login */
  @Post('login/pin')
  @HttpCode(HttpStatus.OK)
  async pinLogin(@Body() dto: PinLoginDto) {
    return this.authService.pinLogin(dto);
  }
}
