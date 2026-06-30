// src/wealth/wealth.controller.ts
// Single controller exposing all /api/v1/wealth/* endpoints

import {
  Controller, Get, Post, Put, Delete,
  Param, Body, Query, Req, UseGuards,
  HttpCode, HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WealthService } from './wealth.service';

@Controller('wealth')
@UseGuards(JwtAuthGuard)
export class WealthController {
  constructor(private readonly wealth: WealthService) {}

  // ── Market Snapshot ───────────────────────────────────────────
  @Get('overview')
  getOverview(@Req() req: any) {
    return this.wealth.getOverview(req.user.sub);
  }

  // ── Gold & Metals ─────────────────────────────────────────────
  @Get('gold/rates')
  getGoldRates() {
    return this.wealth.getMetalPrices();
  }

  @Get('gold/history/:metal')
  getGoldHistory(@Param('metal') metal: string, @Query('days') days = '30') {
    return this.wealth.getMetalHistory(metal, parseInt(days));
  }

  // ── Crypto ────────────────────────────────────────────────────
  @Get('crypto/markets')
  getCryptoMarkets(@Query('ids') ids?: string) {
    return this.wealth.getCryptoMarkets(ids?.split(','));
  }

  @Get('crypto/:coinId/detail')
  getCryptoDetail(@Param('coinId') coinId: string) {
    return this.wealth.getCryptoDetail(coinId);
  }

  @Get('crypto/:coinId/history')
  getCryptoHistory(@Param('coinId') coinId: string, @Query('days') days = '30') {
    return this.wealth.getCryptoHistory(coinId, parseInt(days));
  }

  // ── Forex ─────────────────────────────────────────────────────
  @Get('forex/rates')
  getForexRates() {
    return this.wealth.getForexRates();
  }

  @Get('forex/history')
  getForexHistory(@Query('from') from: string, @Query('to') to: string, @Query('days') days = '30') {
    return this.wealth.getForexHistory(from || 'USD', to || 'INR', parseInt(days));
  }

  // ── Stocks & Indices ─────────────────────────────────────────
  @Get('stocks/indices')
  getIndices() {
    return this.wealth.getIndices();
  }

  @Get('stocks/search')
  searchStocks(@Query('q') q: string) {
    return this.wealth.searchStocks(q || '');
  }

  @Get('stocks/:symbol/quote')
  getStockQuote(@Param('symbol') symbol: string) {
    return this.wealth.getStockQuote(symbol);
  }

  @Get('stocks/:symbol/history')
  getStockHistory(@Param('symbol') symbol: string, @Query('days') days = '30') {
    return this.wealth.getStockHistory(symbol, parseInt(days));
  }

  // ── Mutual Funds ─────────────────────────────────────────────
  @Get('mf/search')
  searchMF(@Query('q') q: string) {
    return this.wealth.searchMF(q || '');
  }

  @Get('mf/:code/nav')
  getMFNav(@Param('code') code: string) {
    return this.wealth.getMFNav(code);
  }

  // ── News ──────────────────────────────────────────────────────
  @Get('news')
  getNews(@Query('category') category = 'all') {
    return this.wealth.getNews(category);
  }

  @Post('news/save')
  saveArticle(@Req() req: any, @Body() body: any) {
    return this.wealth.saveArticle(req.user.sub, body);
  }

  @Delete('news/saved/:id')
  deleteSavedArticle(@Req() req: any, @Param('id') id: string) {
    return this.wealth.deleteSavedArticle(req.user.sub, id);
  }

  @Get('news/saved')
  getSavedArticles(@Req() req: any) {
    return this.wealth.getSavedArticles(req.user.sub);
  }

  // ── Watchlists ────────────────────────────────────────────────
  @Get('watchlists')
  getWatchlists(@Req() req: any) {
    return this.wealth.getWatchlists(req.user.sub);
  }

  @Post('watchlists')
  createWatchlist(@Req() req: any, @Body() body: any) {
    return this.wealth.createWatchlist(req.user.sub, body);
  }

  @Put('watchlists/:id')
  updateWatchlist(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.wealth.updateWatchlist(req.user.sub, id, body);
  }

  @Delete('watchlists/:id')
  deleteWatchlist(@Req() req: any, @Param('id') id: string) {
    return this.wealth.deleteWatchlist(req.user.sub, id);
  }

  @Post('watchlists/:id/items')
  addWatchlistItem(@Req() req: any, @Param('id') watchlistId: string, @Body() body: any) {
    return this.wealth.addWatchlistItem(req.user.sub, watchlistId, body);
  }

  @Delete('watchlists/:id/items/:itemId')
  removeWatchlistItem(@Req() req: any, @Param('id') watchlistId: string, @Param('itemId') itemId: string) {
    return this.wealth.removeWatchlistItem(req.user.sub, watchlistId, itemId);
  }

  // ── Portfolio ─────────────────────────────────────────────────
  @Get('portfolio')
  getPortfolio(@Req() req: any) {
    return this.wealth.getPortfolio(req.user.sub);
  }

  @Get('portfolio/summary')
  getPortfolioSummary(@Req() req: any) {
    return this.wealth.getPortfolioSummary(req.user.sub);
  }

  @Post('portfolio')
  addHolding(@Req() req: any, @Body() body: any) {
    return this.wealth.addHolding(req.user.sub, body);
  }

  @Put('portfolio/:id')
  updateHolding(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.wealth.updateHolding(req.user.sub, id, body);
  }

  @Delete('portfolio/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteHolding(@Req() req: any, @Param('id') id: string) {
    return this.wealth.deleteHolding(req.user.sub, id);
  }

  // ── Price Alerts ──────────────────────────────────────────────
  @Get('alerts')
  getAlerts(@Req() req: any) {
    return this.wealth.getAlerts(req.user.sub);
  }

  @Post('alerts')
  createAlert(@Req() req: any, @Body() body: any) {
    return this.wealth.createAlert(req.user.sub, body);
  }

  @Delete('alerts/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteAlert(@Req() req: any, @Param('id') id: string) {
    return this.wealth.deleteAlert(req.user.sub, id);
  }

  // ── AI Insights ───────────────────────────────────────────────
  @Get('insights')
  getInsights(@Req() req: any) {
    return this.wealth.getInsights(req.user.sub);
  }

  // ── SIP Tracker ───────────────────────────────────────────────
  @Get('sip')
  getSIPEntries(@Req() req: any) {
    return this.wealth.getSIPEntries(req.user.sub);
  }

  @Post('sip')
  addSIPEntry(@Req() req: any, @Body() body: any) {
    return this.wealth.addSIPEntry(req.user.sub, body);
  }

  @Delete('sip/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteSIPEntry(@Req() req: any, @Param('id') id: string) {
    return this.wealth.deleteSIPEntry(req.user.sub, id);
  }

  // ── Calculators (pure math, no DB) ────────────────────────────
  @Get('calculators/sip')
  calcSIP(@Query('monthly') monthly: string, @Query('rate') rate: string, @Query('years') years: string) {
    const P = parseFloat(monthly), r = parseFloat(rate) / 100 / 12, n = parseFloat(years) * 12;
    const futureValue = P * (((Math.pow(1 + r, n) - 1) / r) * (1 + r));
    const invested = P * n;
    return { futureValue: Math.round(futureValue), invested: Math.round(invested), returns: Math.round(futureValue - invested) };
  }

  @Get('calculators/emi')
  calcEMI(@Query('principal') principal: string, @Query('rate') rate: string, @Query('months') months: string) {
    const P = parseFloat(principal), r = parseFloat(rate) / 100 / 12, n = parseFloat(months);
    const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const total = emi * n;
    return { emi: Math.round(emi), totalPayment: Math.round(total), interest: Math.round(total - P) };
  }

  @Get('calculators/compound')
  calcCompound(@Query('principal') principal: string, @Query('rate') rate: string, @Query('years') years: string, @Query('frequency') frequency = '12') {
    const P = parseFloat(principal), r = parseFloat(rate) / 100, t = parseFloat(years), n = parseFloat(frequency);
    const amount = P * Math.pow(1 + r / n, n * t);
    return { maturityAmount: Math.round(amount), invested: Math.round(P), returns: Math.round(amount - P) };
  }

  @Get('calculators/gold')
  calcGold(@Query('grams') grams: string, @Query('karat') karat = '24') {
    // Returns calculation data; actual price fetched separately
    const g = parseFloat(grams), k = parseFloat(karat);
    return { grams: g, karat: k, purityFactor: k / 24 };
  }
}
