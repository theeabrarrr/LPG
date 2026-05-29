import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger('WhatsAppService');

  /**
   * Mock sending WhatsApp alert on Order Assignment
   */
  async sendOrderAssignment(
    to: string,
    driverName: string,
    orderId: string,
    customerName: string,
    quantity: number,
    address: string,
  ) {
    const message = `[WhatsApp Alert] To: ${to} (Driver: ${driverName}) - Order ${orderId} assigned. Customer: ${customerName}, Quantity: ${quantity}, Address: ${address}`;
    this.logger.log(message);
    console.log(message);
  }

  /**
   * Mock sending WhatsApp alert on Order Delivery
   */
  async sendOrderDelivery(
    to: string,
    customerName: string,
    orderId: string,
    quantity: number,
    geofenceViolated: boolean,
  ) {
    const message = `[WhatsApp Alert] To: ${to} (Customer: ${customerName}) - Order ${orderId} delivered. Quantity: ${quantity}. Geofence Violated: ${geofenceViolated}`;
    this.logger.log(message);
    console.log(message);
  }

  /**
   * Mock sending WhatsApp alert on Payment Closeout (Verification)
   */
  async sendPaymentCloseout(
    to: string,
    customerName: string,
    amount: number,
    paymentMethod: string,
    batchId: string,
  ) {
    const message = `[WhatsApp Alert] To: ${to} (Customer: ${customerName}) - Payment of $${amount} via ${paymentMethod} received/cleared. Ledger Batch ID: ${batchId}`;
    this.logger.log(message);
    console.log(message);
  }
}
