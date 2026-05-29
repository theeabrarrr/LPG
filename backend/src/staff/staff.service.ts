import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStaffDto } from './dto/create-staff.dto';

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService) {}

  async createStaff(dto: CreateStaffDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new BadRequestException(`A user with email ${dto.email} already exists.`);
    }

    // Hash provided password or generate a secure temporary one
    const rawPassword = (dto as any).password || this.generateTempPassword();
    const passwordHash = await bcrypt.hash(rawPassword, 12);

    const user = await this.prisma.user.create({
      data: {
        tenantId: dto.tenantId,
        email: dto.email,
        name: dto.name,
        role: dto.role,
        phoneNumber: dto.phoneNumber ?? null,
        pin: dto.pin ?? null,
        passwordHash,
        isActive: true,
      },
    });

    // Return the plain password ONCE so the owner can share it (never stored plain again)
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      pin: user.pin,
      isActive: user.isActive,
      createdAt: user.createdAt,
      _tempPassword: rawPassword,
    };
  }

  async getStaffByTenant(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phoneNumber: true,
        pin: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async updateStaffRole(id: string, role: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`User with ID ${id} not found.`);
    return this.prisma.user.update({ where: { id }, data: { role } });
  }

  async updateStaffStatus(id: string, isActive: boolean) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`User with ID ${id} not found.`);
    return this.prisma.user.update({ where: { id }, data: { isActive } });
  }

  async updateStaffPin(id: string, pin: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`User with ID ${id} not found.`);
    return this.prisma.user.update({ where: { id }, data: { pin } });
  }

  async changePassword(id: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`User with ID ${id} not found.`);
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({ where: { id }, data: { passwordHash } });
    return { success: true, message: 'Password updated successfully.' };
  }

  async deleteStaff(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`User with ID ${id} not found.`);
    return this.prisma.user.update({ where: { id }, data: { isActive: false } });
  }

  private generateTempPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }
}
