import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { SetupOwnerDto } from './dto/setup-owner.dto';
import { LoginDto } from './dto/login.dto';
import { PinLoginDto } from './dto/pin-login.dto';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  // ─────────────────────────────────────────────────────
  // Check if any tenant/owner has been set up yet
  // ─────────────────────────────────────────────────────
  async getSystemStatus() {
    const tenantCount = await this.prisma.tenant.count();
    const ownerCount = await this.prisma.user.count({
      where: { role: 'BUSINESS_OWNER' },
    });
    return {
      isSetupComplete: tenantCount > 0 && ownerCount > 0,
      tenantCount,
    };
  }

  // ─────────────────────────────────────────────────────
  // First-time setup: create Tenant + Owner + Chart of Accounts
  // ─────────────────────────────────────────────────────
  async setupOwner(dto: SetupOwnerDto) {
    // Block if already set up
    const existing = await this.prisma.user.findFirst({
      where: { role: 'BUSINESS_OWNER' },
    });
    if (existing) {
      throw new ConflictException(
        'System is already set up. Please log in with your owner account.',
      );
    }

    // Check email uniqueness
    const emailTaken = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (emailTaken) {
      throw new ConflictException(`Email ${dto.email} is already registered.`);
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    return this.prisma.$transaction(async (tx) => {
      // 1. Create Tenant
      const tenant = await tx.tenant.create({
        data: { name: dto.companyName },
      });

      // 2. Create Owner user
      const owner = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: dto.email,
          name: dto.ownerName,
          role: 'BUSINESS_OWNER',
          passwordHash,
          isActive: true,
        },
      });

      // 3. Bootstrap Chart of Accounts
      const accounts = [
        { name: 'Cash in Hand',               code: '1000', type: 'ASSET' },
        { name: 'Cash in Transit - Drivers',  code: '1100', type: 'ASSET' },
        { name: 'Accounts Receivable',        code: '1200', type: 'ASSET' },
        { name: 'Cylinder Asset Pool',        code: '1300', type: 'ASSET' },
        { name: 'Driver Suspense Cash',       code: '1400', type: 'ASSET' },
        { name: 'LPG Sales Revenue',          code: '4000', type: 'REVENUE' },
        { name: 'Operating Expenses',         code: '5000', type: 'EXPENSE' },
      ];

      for (const a of accounts) {
        await tx.financialAccount.create({
          data: { tenantId: tenant.id, name: a.name, code: a.code, type: a.type, balance: 0 },
        });
      }

      // 4. Bootstrap default warehouse
      await tx.warehouse.create({
        data: {
          tenantId: tenant.id,
          name: `${dto.companyName} - Main Warehouse`,
          location: 'Main Location',
          fullCylinderStock: 0,
          emptyCylinderStock: 0,
          damagedCylinderStock: 0,
        },
      });

      // 5. Log setup audit
      await tx.auditLog.create({
        data: {
          tenantId: tenant.id,
          userId: owner.id,
          action: 'SYSTEM_SETUP',
          entityName: 'Tenant',
          entityId: tenant.id,
        },
      });


      return {
        success: true,
        tenant: { id: tenant.id, name: tenant.name },
        user: {
          id: owner.id,
          name: owner.name,
          email: owner.email,
          role: owner.role,
          tenantId: tenant.id,
        },
      };
    });
  }

  // ─────────────────────────────────────────────────────
  // Web login: email + password
  // ─────────────────────────────────────────────────────
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { tenant: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Your account has been deactivated. Contact your administrator.');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    // Log login
    await this.prisma.auditLog.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        action: 'USER_LOGIN',
        entityName: 'User',
        entityId: user.id,
      },
    });


    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        companyName: user.tenant.name,
      },
    };
  }

  // ─────────────────────────────────────────────────────
  // Mobile PIN login
  // ─────────────────────────────────────────────────────
  async pinLogin(dto: PinLoginDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        tenantId: dto.tenantId,
        pin: dto.pin,
        isActive: true,
        role: { in: ['DRIVER', 'RECOVERY_AGENT'] },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid PIN or account not found.');
    }

    // Log login
    await this.prisma.auditLog.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        action: 'USER_LOGIN',
        entityName: 'User',
        entityId: user.id,
      },
    });


    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
      },
    };
  }

  // ─────────────────────────────────────────────────────
  // Get all tenants (for tenant selector / debug)
  // ─────────────────────────────────────────────────────
  async getTenants() {
    return this.prisma.tenant.findMany({
      select: { id: true, name: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
  }
}
