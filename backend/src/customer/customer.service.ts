import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterCustomerDto } from './dto/register-customer.dto';

@Injectable()
export class CustomerService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Register a new customer
   */
  async registerCustomer(dto: RegisterCustomerDto) {
    // Check if the tenant exists
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: dto.tenantId },
    });
    if (!tenant) {
      throw new BadRequestException(`Tenant with ID ${dto.tenantId} does not exist.`);
    }

    return this.prisma.customer.create({
      data: {
        tenantId: dto.tenantId,
        name: dto.name,
        email: dto.email || null,
        phoneNumber: dto.phoneNumber || null,
        address: dto.address || null,
        latitude: dto.latitude || null,
        longitude: dto.longitude || null,
        creditLimit: dto.creditLimit ?? 0.0,
        creditBalance: 0.0,
        emptyCylinderLiability: 0,
        status: dto.status || 'ACTIVE',
      },
    });
  }

  /**
   * Get all customers for a tenant
   */
  async getCustomersByTenant(tenantId: string) {
    return this.prisma.customer.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get specific customer details including balances
   */
  async getCustomerDetails(customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found.`);
    }

    return customer;
  }

  /**
   * Get customer balances (credit balance and cylinder liability)
   */
  async getCustomerBalances(customerId: string) {
    const customer = await this.getCustomerDetails(customerId);

    return {
      customerId: customer.id,
      name: customer.name,
      creditLimit: customer.creditLimit,
      creditBalance: customer.creditBalance,
      availableCredit: Math.max(0, customer.creditLimit - customer.creditBalance),
      emptyCylinderLiability: customer.emptyCylinderLiability,
      status: customer.status,
    };
  }

  /**
   * Check credit check eligibility for a proposed purchase/order amount
   */
  async checkCreditEligibility(customerId: string, orderAmount: number) {
    const customer = await this.getCustomerDetails(customerId);

    if (customer.status !== 'ACTIVE') {
      return {
        eligible: false,
        reason: `Customer is not active. Status: ${customer.status}`,
        creditLimit: customer.creditLimit,
        creditBalance: customer.creditBalance,
        availableCredit: 0,
        requestedAmount: orderAmount,
      };
    }

    const availableCredit = customer.creditLimit - customer.creditBalance;
    const isEligible = customer.creditBalance + orderAmount <= customer.creditLimit;

    return {
      eligible: isEligible,
      reason: isEligible ? 'Eligible' : 'Requested order amount exceeds available credit limit.',
      creditLimit: customer.creditLimit,
      creditBalance: customer.creditBalance,
      availableCredit: Math.round(availableCredit * 100) / 100,
      requestedAmount: orderAmount,
    };
  }

  /**
   * Update customer status (ACTIVE, BLOCKED, SUSPENDED)
   */
  async updateCustomerStatus(customerId: string, status: 'ACTIVE' | 'BLOCKED' | 'SUSPENDED') {
    const customer = await this.getCustomerDetails(customerId);

    return this.prisma.customer.update({
      where: { id: customerId },
      data: { status },
    });
  }
}
