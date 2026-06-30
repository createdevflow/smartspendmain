import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Payment')
@Controller('payment')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create-order')
  @ApiOperation({ summary: 'Create Razorpay Order for Subscription' })
  async createOrder(@CurrentUser() user: any, @Body() body: { planId: string; amount: number; currency?: string }) {
    return this.paymentService.createOrder(user.sub, body.planId, body.amount, body.currency);
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verify Razorpay Payment Signature' })
  async verifyPayment(@CurrentUser() user: any, @Body() body: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) {
    return this.paymentService.verifyPayment(user.sub, body.razorpay_order_id, body.razorpay_payment_id, body.razorpay_signature);
  }
}
