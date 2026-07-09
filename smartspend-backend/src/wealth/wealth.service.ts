// src/wealth/wealth.service.ts
// Business logic layer — delegates market data fetching to MarketDataService,
// handles user-specific DB operations (watchlists, portfolio, alerts, SIP)

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MarketDataService } from './market-data/market-data.service';
import { WealthAssetType, AlertDirection } from '@prisma/client';

@Injectable()
export class WealthService {
  constructor(
    private prisma: PrismaService,
    private market: MarketDataService,
  ) {}

  // ── Overview ─────────────────────────────────────────────────
  async getOverview(userId: string) {
    const [metals, cryptos, indices, portfolio] = await Promise.allSettled([
      this.market.getMetalPrices(),
      this.market.getCryptoMarkets(),
      this.market.getIndices(),
      this.getPortfolioSummary(userId),
    ]);

    return {
      metals:    metals.status    === 'fulfilled' ? metals.value    : null,
      cryptos:   cryptos.status   === 'fulfilled' ? cryptos.value.slice(0, 5) : [],
      indices:   indices.status   === 'fulfilled' ? indices.value   : [],
      portfolio: portfolio.status === 'fulfilled' ? portfolio.value : null,
      updatedAt: new Date().toISOString(),
    };
  }

  // ── Metal Proxy ────────────────────────────────────────────────
  getMetalPrices()                                { return this.market.getMetalPrices(); }
  getMetalHistory(metal: string, days: number)   { return this.market.getMetalHistory(metal, days); }

  // ── Crypto Proxy ───────────────────────────────────────────────
  getCryptoMarkets(ids?: string[])               { return this.market.getCryptoMarkets(ids); }
  getCryptoDetail(coinId: string)                { return this.market.getCryptoDetail(coinId); }
  getCryptoHistory(coinId: string, days: number) { return this.market.getCryptoHistory(coinId, days); }

  // ── Forex Proxy ────────────────────────────────────────────────
  async getForexRates() {
    const [inrRates, usdRates] = await Promise.all([
      this.market.getInrRates(),
      this.market.getForexRates('USD'),
    ]);
    const popularCurrencies = ['USD', 'EUR', 'GBP', 'AED', 'SGD', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY'];
    return popularCurrencies.map((code) => ({
      code,
      name: CURRENCY_NAMES[code] ?? code,
      rateToInr: inrRates[code] ? parseFloat(inrRates[code].toFixed(4)) : null,
      rateFromInr: inrRates[code] ? parseFloat((1 / inrRates[code]).toFixed(6)) : null,
    }));
  }
  getForexHistory(from: string, to: string, days: number) { return this.market.getForexHistory(from, to, days); }

  // ── Stocks/Indices Proxy ───────────────────────────────────────
  getIndices()                                          { return this.market.getIndices(); }
  searchStocks(q: string)                              { return this.market.searchStocks(q); }
  getStockQuote(symbol: string)                        { return this.market.getStockQuote(symbol); }
  getStockHistory(symbol: string, days: number)        { return this.market.getStockHistory(symbol, days); }

  // ── Mutual Funds ───────────────────────────────────────────────
  searchMF(q: string)         { return this.market.searchMutualFunds(q); }
  getMFNav(code: string)      { return this.market.getMFNav(code); }

  // ── News ───────────────────────────────────────────────────────
  async getNews(category: string) {
    const [externalNews, ourPosts] = await Promise.all([
      this.market.getFinancialNews(category).catch(() => []),
      this.prisma.blog.findMany({
        where: {
          status: 'PUBLISHED',
          ...(category && category !== 'all' ? {
            category: { name: { equals: category, mode: 'insensitive' } }
          } : {})
        },
        include: { category: true, author: true },
        orderBy: { publishedAt: 'desc' },
        take: 15,
      }).catch(() => []),
    ]);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3002';

    const formattedOurPosts = ourPosts.map(post => ({
      id: post.id,
      title: post.title,
      url: `${siteUrl}/blog/${post.slug}`,
      summary: post.excerpt || '',
      imageUrl: post.coverImage || null,
      source: 'Cashtro Editorial',
      category: post.category?.name?.toLowerCase() || 'all',
      publishedAt: post.publishedAt?.toISOString() || post.createdAt?.toISOString() || null,
      isCashtroBlog: true,
      slug: post.slug,
    }));

    return [...formattedOurPosts, ...externalNews];
  }

  async saveArticle(userId: string, body: any) {
    return this.prisma.savedArticle.upsert({
      where: { userId_url: { userId, url: body.url } },
      create: { userId, url: body.url, title: body.title, summary: body.summary, imageUrl: body.imageUrl, source: body.source, category: body.category },
      update: {},
    });
  }

  async deleteSavedArticle(userId: string, id: string) {
    const article = await this.prisma.savedArticle.findUnique({ where: { id } });
    if (!article || article.userId !== userId) throw new NotFoundException();
    await this.prisma.savedArticle.delete({ where: { id } });
  }

  getSavedArticles(userId: string) {
    return this.prisma.savedArticle.findMany({ where: { userId }, orderBy: { savedAt: 'desc' } });
  }

  // ── Watchlists ────────────────────────────────────────────────
  async getWatchlists(userId: string) {
    return this.prisma.watchlist.findMany({
      where: { userId },
      include: { items: { orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createWatchlist(userId: string, body: any) {
    return this.prisma.watchlist.create({
      data: { userId, name: body.name, color: body.color ?? '#2563EB', icon: body.icon ?? 'star' },
    });
  }

  async updateWatchlist(userId: string, id: string, body: any) {
    await this.assertWatchlistOwner(userId, id);
    return this.prisma.watchlist.update({
      where: { id },
      data: { name: body.name, color: body.color, icon: body.icon },
    });
  }

  async deleteWatchlist(userId: string, id: string) {
    await this.assertWatchlistOwner(userId, id);
    await this.prisma.watchlist.delete({ where: { id } });
  }

  async addWatchlistItem(userId: string, watchlistId: string, body: any) {
    await this.assertWatchlistOwner(userId, watchlistId);
    return this.prisma.watchlistItem.upsert({
      where: { watchlistId_symbol: { watchlistId, symbol: body.symbol } },
      create: {
        watchlistId,
        assetType: body.assetType as WealthAssetType,
        symbol: body.symbol,
        displayName: body.displayName,
        note: body.note,
        alertPrice: body.alertPrice,
        alertAbove: body.alertAbove ?? true,
      },
      update: { note: body.note, alertPrice: body.alertPrice, alertAbove: body.alertAbove ?? true },
    });
  }

  async removeWatchlistItem(userId: string, watchlistId: string, itemId: string) {
    await this.assertWatchlistOwner(userId, watchlistId);
    await this.prisma.watchlistItem.delete({ where: { id: itemId } });
  }

  private async assertWatchlistOwner(userId: string, watchlistId: string) {
    const wl = await this.prisma.watchlist.findUnique({ where: { id: watchlistId } });
    if (!wl || wl.userId !== userId) throw new ForbiddenException();
  }

  // ── Portfolio ─────────────────────────────────────────────────
  getPortfolio(userId: string) {
    return this.prisma.portfolioHolding.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  async getPortfolioSummary(userId: string) {
    const holdings = await this.prisma.portfolioHolding.findMany({ where: { userId } });
    if (!holdings.length) return { totalInvested: 0, totalValue: 0, pnl: 0, pnlPercent: 0, holdings: [] };

    let totalInvested = 0;
    const enriched = await Promise.all(
      holdings.map(async (h) => {
        const invested = h.buyPrice * h.quantity;
        totalInvested += invested;
        let currentPrice = h.buyPrice;
        try {
          if (h.assetType === 'CRYPTO') {
            const markets = await this.market.getCryptoMarkets();
            const coin = (markets as any[]).find((c: any) => c.symbol?.toUpperCase() === h.symbol.toUpperCase());
            if (coin) currentPrice = coin.current_price;
          } else if (h.assetType === 'STOCK') {
            const q = await this.market.getStockQuote(h.symbol);
            if (q?.price) currentPrice = q.price;
          } else if (h.assetType === 'GOLD') {
            const metals = await this.market.getMetalPrices() as any;
            if (metals?.gold24k?.priceInrPerGram) currentPrice = metals.gold24k.priceInrPerGram;
          }
        } catch (_) {}
        const currentValue = currentPrice * h.quantity;
        const pnl = currentValue - invested;
        return { ...h, currentPrice, currentValue, invested, pnl, pnlPercent: ((pnl / invested) * 100) };
      }),
    );

    const totalValue = enriched.reduce((s, h) => s + h.currentValue, 0);
    return {
      totalInvested,
      totalValue,
      pnl: totalValue - totalInvested,
      pnlPercent: totalInvested > 0 ? ((totalValue - totalInvested) / totalInvested) * 100 : 0,
      holdings: enriched,
    };
  }

  async addHolding(userId: string, body: any) {
    return this.prisma.portfolioHolding.create({
      data: {
        userId,
        assetType: body.assetType as WealthAssetType,
        symbol: body.symbol,
        displayName: body.displayName,
        quantity: parseFloat(body.quantity),
        buyPrice: parseFloat(body.buyPrice),
        buyDate: body.buyDate ? new Date(body.buyDate) : null,
        notes: body.notes,
      },
    });
  }

  async updateHolding(userId: string, id: string, body: any) {
    const h = await this.prisma.portfolioHolding.findUnique({ where: { id } });
    if (!h || h.userId !== userId) throw new ForbiddenException();
    return this.prisma.portfolioHolding.update({
      where: { id },
      data: { quantity: parseFloat(body.quantity), buyPrice: parseFloat(body.buyPrice), notes: body.notes },
    });
  }

  async deleteHolding(userId: string, id: string) {
    const h = await this.prisma.portfolioHolding.findUnique({ where: { id } });
    if (!h || h.userId !== userId) throw new ForbiddenException();
    await this.prisma.portfolioHolding.delete({ where: { id } });
  }

  // ── Price Alerts ──────────────────────────────────────────────
  getAlerts(userId: string) {
    return this.prisma.priceAlert.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  createAlert(userId: string, body: any) {
    return this.prisma.priceAlert.create({
      data: {
        userId,
        assetType: body.assetType as WealthAssetType,
        symbol: body.symbol,
        displayName: body.displayName,
        targetPrice: parseFloat(body.targetPrice),
        direction: body.direction as AlertDirection,
      },
    });
  }

  async deleteAlert(userId: string, id: string) {
    const a = await this.prisma.priceAlert.findUnique({ where: { id } });
    if (!a || a.userId !== userId) throw new ForbiddenException();
    await this.prisma.priceAlert.delete({ where: { id } });
  }

  // ── AI Insights ───────────────────────────────────────────────
  getInsights(userId: string) {
    return this.market.generateInsights(userId);
  }

  // ── SIP ───────────────────────────────────────────────────────
  getSIPEntries(userId: string) {
    return this.prisma.sIPEntry.findMany({ where: { userId, isActive: true }, orderBy: { createdAt: 'desc' } });
  }

  addSIPEntry(userId: string, body: any) {
    return this.prisma.sIPEntry.create({
      data: {
        userId,
        fundName: body.fundName,
        amfiCode: body.amfiCode,
        monthlyAmt: parseFloat(body.monthlyAmt),
        startDate: new Date(body.startDate),
        units: parseFloat(body.units ?? 0),
        avgNav: parseFloat(body.avgNav ?? 0),
      },
    });
  }

  async deleteSIPEntry(userId: string, id: string) {
    const s = await this.prisma.sIPEntry.findUnique({ where: { id } });
    if (!s || s.userId !== userId) throw new ForbiddenException();
    await this.prisma.sIPEntry.update({ where: { id }, data: { isActive: false } });
  }
}

// ── Currency name map ─────────────────────────────────────────
const CURRENCY_NAMES: Record<string, string> = {
  USD: 'US Dollar', EUR: 'Euro', GBP: 'British Pound', AED: 'UAE Dirham',
  SGD: 'Singapore Dollar', JPY: 'Japanese Yen', AUD: 'Australian Dollar',
  CAD: 'Canadian Dollar', CHF: 'Swiss Franc', CNY: 'Chinese Yuan',
  INR: 'Indian Rupee',
};
