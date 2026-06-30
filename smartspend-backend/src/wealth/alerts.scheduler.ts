// src/wealth/alerts.scheduler.ts
// Checks price alerts every 5 minutes and sends push notifications
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { MarketDataService } from './market-data/market-data.service';

@Injectable()
export class AlertsScheduler {
  private readonly logger = new Logger(AlertsScheduler.name);

  constructor(
    private prisma: PrismaService,
    private market: MarketDataService,
  ) {}

  @Cron('*/5 * * * *') // every 5 minutes
  async checkPriceAlerts() {
    try {
      const alerts = await this.prisma.priceAlert.findMany({
        where: { triggered: false },
        include: { user: { select: { expoPushToken: true, pushNotifications: true } } },
      });

      if (!alerts.length) return;

      for (const alert of alerts) {
        try {
          let currentPrice: number | null = null;

          if (alert.assetType === 'CRYPTO') {
            const markets = await this.market.getCryptoMarkets() as any[];
            const coin = markets.find((c: any) => c.symbol?.toUpperCase() === alert.symbol.toUpperCase());
            currentPrice = coin?.current_price ?? null;
          } else if (alert.assetType === 'GOLD' || alert.assetType === 'SILVER' || alert.assetType === 'PLATINUM') {
            const metals = await this.market.getMetalPrices() as any;
            const metalKey = alert.assetType.toLowerCase();
            currentPrice = metals[metalKey]?.priceInrPerGram ?? null;
          } else if (alert.assetType === 'STOCK') {
            const quote = await this.market.getStockQuote(alert.symbol) as any;
            currentPrice = quote?.price ?? null;
          } else if (alert.assetType === 'FOREX') {
            const rates = await this.market.getInrRates();
            currentPrice = rates[alert.symbol] ?? null;
          }

          if (currentPrice === null) continue;

          const triggered =
            alert.direction === 'ABOVE'
              ? currentPrice >= alert.targetPrice
              : currentPrice <= alert.targetPrice;

          if (triggered) {
            await this.prisma.priceAlert.update({
              where: { id: alert.id },
              data: { triggered: true, triggeredAt: new Date() },
            });

            // Send push notification if user has token
            if (alert.user?.expoPushToken && alert.user.pushNotifications) {
              await this.sendExpoNotification(
                alert.user.expoPushToken,
                `🔔 Price Alert: ${alert.displayName}`,
                `${alert.displayName} has reached ₹${currentPrice.toFixed(2)} (target: ₹${alert.targetPrice})`,
              );
            }

            // Also save in-app notification
            await this.prisma.notification.create({
              data: {
                userId: alert.userId,
                type: 'IN_APP',
                title: `🔔 Price Alert Triggered`,
                body: `${alert.displayName} hit your target price of ₹${alert.targetPrice}. Current: ₹${currentPrice.toFixed(2)}`,
                data: { assetType: alert.assetType, symbol: alert.symbol, price: currentPrice },
              },
            });

            this.logger.log(`Alert triggered: ${alert.displayName} at ${currentPrice}`);
          }
        } catch (err) {
          this.logger.warn(`Alert check failed for ${alert.id}:`, err?.message);
        }
      }
    } catch (err) {
      this.logger.error('Price alerts scheduler error:', err);
    }
  }

  private async sendExpoNotification(token: string, title: string, body: string) {
    try {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: token, title, body, sound: 'default' }),
      });
    } catch (_) {}
  }
}
