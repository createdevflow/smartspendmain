import { Injectable, BadRequestException, Logger } from '@nestjs/common';

@Injectable()
export class AiValidationUtil {
  private readonly logger = new Logger(AiValidationUtil.name);

  // Supported MIME types for vision/document tasks
  private readonly SUPPORTED_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf'];
  
  // 10 MB max size
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024;
  
  // 50,000 characters max prompt length
  private readonly MAX_PROMPT_LENGTH = 50000;

  /**
   * Validates an uploaded file before sending it to the AI.
   */
  public validateFile(mimeType: string, size: number) {
    if (!this.SUPPORTED_MIMES.includes(mimeType)) {
      this.logger.warn(`Unsupported file type attempted: ${mimeType}`);
      throw new BadRequestException(`Unsupported file type: ${mimeType}. Supported types: ${this.SUPPORTED_MIMES.join(', ')}`);
    }

    if (size > this.MAX_FILE_SIZE) {
      this.logger.warn(`File too large: ${size} bytes`);
      throw new BadRequestException(`File exceeds maximum allowed size of 10MB.`);
    }
  }

  /**
   * Validates a prompt for safety, length, and injection attempts.
   */
  public validatePrompt(prompt: string, maxLengthOverride?: number) {
    if (!prompt || prompt.trim().length === 0) {
      throw new BadRequestException('Prompt cannot be empty.');
    }

    const maxLen = maxLengthOverride || this.MAX_PROMPT_LENGTH;
    if (prompt.length > maxLen) {
      this.logger.warn(`Prompt exceeded max length: ${prompt.length} > ${maxLen}`);
      throw new BadRequestException(`Prompt is too long. Maximum allowed length is ${maxLen} characters.`);
    }

    // Basic heuristic to block "Ignore previous instructions" style prompt injections
    const injectionKeywords = [
      'ignore all previous',
      'ignore previous instructions',
      'disregard previous',
      'system prompt',
      'you are now',
    ];

    const lowerPrompt = prompt.toLowerCase();
    for (const kw of injectionKeywords) {
      if (lowerPrompt.includes(kw)) {
        this.logger.warn(`Potential prompt injection detected: "${kw}"`);
        throw new BadRequestException('Your request was rejected due to policy violations.');
      }
    }
  }
}
