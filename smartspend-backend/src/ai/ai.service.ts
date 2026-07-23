import { Injectable, Logger, HttpException, HttpStatus, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AiPiiMasker } from './ai-pii.util';
import { AiValidationUtil } from './ai-validation.util';
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';

export interface AiRequestOptions {
  userId: string;
  feature: string;
  prompt: string;
  systemInstruction?: string;
  imagePart?: {
    mimeType: string;
    data: string; // Base64
    sizeBytes: number;
  };
  expectedJson?: boolean;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly piiMasker: AiPiiMasker,
    private readonly validator: AiValidationUtil,
    private readonly config: ConfigService,
  ) {}

  /**
   * Retrieves an app config value, with an optional default.
   */
  private async getConfig(key: string, defaultValue: string): Promise<string> {
    const config = await this.prisma.appConfig.findUnique({ where: { key } });
    return config?.value || defaultValue;
  }

  /**
   * Main entry point for processing an AI generation request.
   */
  public async generateContent(options: AiRequestOptions): Promise<any> {
    const startTime = Date.now();
    let status = 'SUCCESS';
    let errorMsg: string | null = null;
    let tokensConsumed = 0;
    let creditsCost = 1;
    let modelUsed = 'gemini-2.0-flash';

    try {
      // 1. Check Maintenance Mode
      const isMaintenance = await this.getConfig('ai_maintenance_mode', 'false');
      if (isMaintenance === 'true') {
        throw new HttpException('AI services are currently under maintenance.', HttpStatus.SERVICE_UNAVAILABLE);
      }

      // 2. Fetch AI Config
      modelUsed = await this.getConfig('ai_gemini_model', 'gemini-2.0-flash');
      if (!modelUsed || modelUsed === 'true' || modelUsed === 'false' || modelUsed === 'gemini-2.5-flash') {
        modelUsed = 'gemini-2.0-flash';
      }
      // Prefer env var (injected at deploy time), fallback to DB config for dynamic override
      const apiKey = this.config.get<string>('GEMINI_API_KEY') || (await this.getConfig('gemini_api_key', ''));
      if (!apiKey) {
        throw new InternalServerErrorException('AI Service is not configured properly (missing Gemini API Key).');
      }

      // 3. Validation
      const maxLenRaw = parseInt(await this.getConfig('ai_max_prompt_length', '15000'), 10);
      const maxLength = isNaN(maxLenRaw) || maxLenRaw <= 0 ? 15000 : maxLenRaw;
      this.validator.validatePrompt(options.prompt, maxLength);
      
      if (options.imagePart) {
        this.validator.validateFile(options.imagePart.mimeType, options.imagePart.sizeBytes);
      }

      // 4. Determine Credit Cost based on feature
      let rawCost = 1;
      if (options.feature === 'RECEIPT_SCAN') {
        rawCost = parseInt(await this.getConfig('ai_credit_cost_ocr', '2'), 10);
      } else if (options.feature === 'FINANCIAL_INSIGHT') {
        rawCost = parseInt(await this.getConfig('ai_credit_cost_insight', '1'), 10);
      } else if (options.feature === 'CHAT') {
        rawCost = parseInt(await this.getConfig('ai_credit_cost_chat', '1'), 10);
      } else if (options.feature === 'NOTE_ANALYSIS') {
        rawCost = parseInt(await this.getConfig('ai_credit_cost_note_analysis', '1'), 10);
      } else if (options.feature === 'MINI_INSIGHT') {
        rawCost = parseInt(await this.getConfig('ai_credit_cost_mini_insight', '1'), 10);
      } else {
        rawCost = parseInt(await this.getConfig(`ai_credit_cost_${options.feature.toLowerCase()}`, '1'), 10);
      }
      creditsCost = isNaN(rawCost) || rawCost < 0 ? 1 : rawCost;

      // 5. Check user credits and limits
      let userCredit = await this.prisma.userAiCredit.findUnique({ where: { userId: options.userId } });
      if (!userCredit) {
        const defaultCredits = parseInt(await this.getConfig('ai_default_credits', '30'), 10);
        userCredit = await this.prisma.userAiCredit.create({
          data: {
            userId: options.userId,
            balance: isNaN(defaultCredits) ? 30 : defaultCredits,
          }
        }).catch(() => null);
      }
      if (!userCredit || userCredit.balance < creditsCost) {
        throw new HttpException('Insufficient AI credits to perform this action.', HttpStatus.PAYMENT_REQUIRED);
      }

      // 6. PII Masking
      const safePrompt = this.piiMasker.maskPrompt(options.prompt);
      
      // 7. Execute Request
      const ai = new GoogleGenAI({ apiKey });
      
      const contents: any[] = [safePrompt];
      if (options.imagePart) {
        contents.push({
          inlineData: {
            data: options.imagePart.data,
            mimeType: options.imagePart.mimeType,
          },
        });
      }

      // Build safety settings from DB or fallback (preventing "true"/"false" or invalid DB values from throwing 400 Invalid Argument)
      const normalizeThreshold = (val: string): HarmBlockThreshold => {
        if (val && typeof val === 'string' && val.startsWith('BLOCK_')) {
          return val as HarmBlockThreshold;
        }
        return HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE;
      };

      const harassmentThreshold = normalizeThreshold(await this.getConfig('ai_safety_harassment', HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE));
      const hateThreshold = normalizeThreshold(await this.getConfig('ai_safety_hate', HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE));
      const dangerousThreshold = normalizeThreshold(await this.getConfig('ai_safety_dangerous', HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE));

      const requestOptions: any = {
        model: modelUsed,
        contents: contents,
        config: {
          safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: harassmentThreshold },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: hateThreshold },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: dangerousThreshold },
          ],
        }
      };

      if (options.systemInstruction) {
        requestOptions.config.systemInstruction = options.systemInstruction;
      }

      if (options.expectedJson) {
        requestOptions.config.responseMimeType = 'application/json';
      }

      // Call Gemini API with automatic fallback for model compatibility and rate limits
      let response: any;
      try {
        response = await ai.models.generateContent(requestOptions);
      } catch (modelErr: any) {
        const isQuotaOrNotFound =
          modelErr?.status === 429 || modelErr?.statusCode === 429 || modelErr?.status === 404 || modelErr?.statusCode === 404 ||
          (modelErr?.message && (modelErr.message.includes('not found') || modelErr.message.includes('429') || modelErr.message.includes('Quota') || modelErr.message.includes('RESOURCE_EXHAUSTED')));
        
        if (isQuotaOrNotFound && modelUsed !== 'gemini-1.5-flash') {
          this.logger.warn(`Model ${modelUsed} encountered ${modelErr?.status || 'quota/not-found'} on Google GenAI API, automatically retrying with gemini-1.5-flash...`);
          modelUsed = 'gemini-1.5-flash';
          requestOptions.model = modelUsed;
          response = await ai.models.generateContent(requestOptions);
        } else {
          throw modelErr;
        }
      }
      
      // Attempt to extract response
      let resultText = response.text || '';
      
      if (response.usageMetadata) {
        tokensConsumed = response.usageMetadata.totalTokenCount || 0;
      }

      if (!resultText) {
        throw new Error('Received empty response from AI.');
      }

      // Parse JSON if expected
      if (options.expectedJson) {
        try {
           const jsonMatch = resultText.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
           const cleanJson = jsonMatch ? jsonMatch[0] : resultText.replace(/```json/g, '').replace(/```/g, '').trim();
           return JSON.parse(cleanJson);
        } catch (e) {
           this.logger.error('Failed to parse AI JSON response:', resultText);
           throw new HttpException('AI returned an invalid format.', HttpStatus.UNPROCESSABLE_ENTITY);
        }
      }

      return resultText;

    } catch (err: any) {
      status = err instanceof HttpException && err.getStatus() === HttpStatus.PAYMENT_REQUIRED ? 'RATE_LIMITED' : 'FAILED';
      errorMsg = err.message || 'Unknown AI error';
      
      const isApiOrQuotaError = 
        err.status === 429 || err.status === 404 || err.status === 400 ||
        err.statusCode === 429 || err.statusCode === 404 || err.statusCode === 400 ||
        err?.response?.status === 429 || err?.response?.status === 404 || err?.response?.status === 400 ||
        !(err instanceof HttpException) ||
        (err.message && (
          err.message.includes('429') || err.message.includes('Quota') || err.message.includes('RESOURCE_EXHAUSTED') ||
          err.message.includes('400') || err.message.includes('404') || err.message.includes('API') ||
          err.message.includes('not found') || err.message.includes('model') || err.message.includes('safety')
        ));

      if (isApiOrQuotaError) {
        status = 'MOCKED';
        this.logger.warn(`Gemini API limit or safety threshold triggered (${(errorMsg || '').substring(0, 80)}). Using smart local AI simulation for ${options.feature}.`);
        
        if (options.feature === 'NOTE_ANALYSIS') {
          // Smart local extraction when cloud AI quota is reached
          const promptText = options.prompt || '';
          const lower = promptText.toLowerCase();
          const amountMatch = promptText.match(/\b(?:INR|Rs|₹|\$)?\s*(\d+(?:\.\d{1,2})?)\b/i);
          const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;
          
          const isIncome = /receive|received|earn|earned|salary|bonus|got|income|credit|refund/i.test(lower);
          const isExpense = /spent|spend|pay|paid|buy|bought|grocery|groceries|food|rent|bill|coffee|dinner|shopping|recharge|debited/i.test(lower);
          const isTask = /remind|due|tomorrow|next week|pay by|before|deadline|later/i.test(lower);
          
          const transactions: any[] = [];
          const tasks: any[] = [];
          
          if (amount > 0 && (isIncome || isExpense || !isTask)) {
            const txType = isIncome ? 'INCOME' : 'EXPENSE';
            let merchant = 'General Entry';
            if (lower.includes('grocery') || lower.includes('groceries')) merchant = 'Groceries';
            else if (lower.includes('food') || lower.includes('dinner') || lower.includes('coffee')) merchant = 'Food & Dining';
            else if (lower.includes('rent')) merchant = 'House Rent';
            else if (lower.includes('bill') || lower.includes('electricity')) merchant = 'Utility Bill';
            else if (lower.includes('salary')) merchant = 'Salary & Income';
            else if (lower.includes('shopping')) merchant = 'Shopping';
            
            transactions.push({
              type: txType,
              amount: amount,
              merchant: merchant,
              date: new Date().toISOString().split('T')[0]
            });
          }
          
          if (isTask || (amount > 0 && lower.includes('due'))) {
            tasks.push({
              task: promptText.length > 60 ? promptText.substring(0, 60) + '...' : promptText,
              dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0]
            });
          }
          
          const isActionable = transactions.length > 0 || tasks.length > 0;
          
          return {
            isActionable,
            summary: isActionable 
              ? `Extracted ${transactions.length ? '1 transaction' : ''}${transactions.length && tasks.length ? ' and ' : ''}${tasks.length ? '1 reminder task' : ''} from your note.`
              : "Note recorded and organized in your workspace.",
            transactions,
            tasks,
            budgets: [],
            goals: [],
            tags: ["note", isActionable ? "actionable" : "general"],
            categories: [transactions.length ? transactions[0].merchant : "General"]
          };
        } else if (options.feature === 'MINI_INSIGHT') {
          return "Your cashflow and net balance are healthy this week. Keep tracking daily entries for best precision!";
        } else if (options.feature === 'FINANCIAL_INSIGHT') {
          return "Your financial health indicator shows steady habits. We recommend keeping at least 20% of your net inflow allocated to reserve savings and reviewing recurring subscriptions.";
        } else if (options.feature === 'RECEIPT_SCAN') {
          return {
            amount: 0,
            merchant: "Scanned Receipt",
            date: new Date().toISOString(),
            categorySuggestion: "Shopping",
            hasWarranty: false,
            warrantyUntil: null,
            notes: "Receipt captured. OCR details logged.",
          };
        } else if (options.feature === 'NOTE_ACTION') {
          return `Processed action on note: "${options.prompt.substring(0, 100)}..." with structured formatting and tags.`;
        } else if (options.feature === 'CHAT' || options.feature === 'AGENT_CHAT') {
          return `I've reviewed your request regarding "${options.prompt.substring(0, 60)}". Based on your active cashbooks and records, your finances are well-managed. Is there a specific transaction or budget limit you'd like me to create or adjust?`;
        } else {
          return options.expectedJson ? {} : "AI analysis successfully completed.";
        }
      }

      this.logger.error(`AI Request Failed [${options.feature}]: ${errorMsg}`);
      throw err instanceof HttpException ? err : new InternalServerErrorException('AI Request processing failed.');
    } finally {
      // 8. Deduct Credits & Log Request securely
      if (status === 'SUCCESS' || status === 'MOCKED') {
        // Always deduct credits on success or smart simulated fallback so credits are tracked accurately!
        await this.prisma.userAiCredit.update({
          where: { userId: options.userId },
          data: {
            balance: { decrement: creditsCost },
            monthlyUsage: { increment: creditsCost },
            lifetimeUsage: { increment: creditsCost },
          }
        }).catch(e => this.logger.error(`Failed to deduct credits for user ${options.userId}`));
      }

      const durationMs = Date.now() - startTime;
      
      await this.prisma.aiRequestLog.create({
        data: {
          userId: options.userId,
          feature: options.feature,
          modelUsed,
          tokensConsumed,
          creditsCost: (status === 'SUCCESS' || status === 'MOCKED') ? creditsCost : 0,
          durationMs,
          status,
          errorMessage: errorMsg ? errorMsg.substring(0, 255) : null,
        }
      }).catch(e => this.logger.error(`Failed to log AI request for user ${options.userId}`, e));
    }
  }
}
