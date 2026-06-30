import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
const Razorpay = require('razorpay');
import * as crypto from 'crypto';

@Injectable()
export class PaymentService {
  private razorpay: any;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  private async getKeys() {
    const [dbId, dbSecret] = await Promise.all([
      this.prisma.appConfig.findUnique({ where: { key: 'razorpay_key_id' } }),
      this.prisma.appConfig.findUnique({ where: { key: 'razorpay_key_secret' } })
    ]);
    const key_id = dbId?.value || this.config.get<string>('RAZORPAY_KEY_ID');
    const key_secret = dbSecret?.value || this.config.get<string>('RAZORPAY_KEY_SECRET');
    return { key_id, key_secret };
  }

  private async getRazorpay() {
    const { key_id, key_secret } = await this.getKeys();
    if (!key_id || !key_secret) return null;
    return new Razorpay({ key_id, key_secret });
  }

  async createOrder(userId: string, planId: string, amount: number, currency: string = 'INR') {
    const rzp = await this.getRazorpay();
    const { key_id } = await this.getKeys();

    if (!rzp) {
      throw new InternalServerErrorException('Razorpay is not configured on the server.');
    }

    // Verify plan exists
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) {
      throw new BadRequestException('Invalid plan selected.');
    }

    try {
      const options = {
        amount: Math.round(amount * 100), // amount in smallest currency unit (paise)
        currency,
        receipt: `receipt_${Date.now()}_${userId.substring(0, 5)}`,
      };

      const order = await rzp.orders.create(options);

      // Save order in DB
      await this.prisma.subscriptionOrder.create({
        data: {
          userId,
          planId,
          orderId: order.id,
          amount,
          currency,
          status: 'created',
        },
      });

      return {
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: key_id,
      };
    } catch (error) {
      console.error('Razorpay Create Order Error:', error);
      throw new InternalServerErrorException('Failed to create payment order.');
    }
  }

  async verifyPayment(userId: string, orderId: string, paymentId: string, signature: string) {
    const { key_secret: secret } = await this.getKeys();
    if (!secret) throw new InternalServerErrorException('Razorpay secret not configured.');

    // Find the order
    const order = await this.prisma.subscriptionOrder.findUnique({
      where: { orderId },
    });

    if (!order) {
      throw new BadRequestException('Order not found.');
    }

    if (order.userId !== userId) {
      throw new BadRequestException('Unauthorized order verification.');
    }

    // Verify signature
    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(orderId + '|' + paymentId)
      .digest('hex');

    if (generatedSignature !== signature) {
      // Failed verification
      await this.prisma.subscriptionOrder.update({
        where: { orderId },
        data: { status: 'failed', paymentId },
      });
      throw new BadRequestException('Invalid payment signature.');
    }

    // Success!
    await this.prisma.$transaction([
      this.prisma.subscriptionOrder.update({
        where: { orderId },
        data: { status: 'paid', paymentId, signature },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { planId: order.planId },
      }),
    ]);

    return {
      success: true,
      message: 'Payment verified and plan activated successfully.',
    };
  }
}
