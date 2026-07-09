import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AiPiiMasker {
  private readonly logger = new Logger(AiPiiMasker.name);

  // Patterns for Indian financial PII
  private readonly patterns = {
    // Matches Indian PAN card format (5 letters, 4 numbers, 1 letter)
    pan: /\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/gi,
    
    // Matches GSTIN (2 digits, 10 char PAN, 1 digit, 1 letter, 1 digit)
    gstin: /\b[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}\b/gi,
    
    // Matches 12-digit Aadhaar numbers
    aadhaar: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
    
    // Matches UPI IDs (e.g., name@okicici, name@ybl)
    upi: /\b[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}\b/gi,
    
    // Matches Credit/Debit Card numbers (16 digits)
    creditCard: /\b(?:\d[ -]*?){13,16}\b/g,
  };

  /**
   * Redacts sensitive financial PII from the given text.
   */
  public maskPrompt(text: string): string {
    if (!text) return text;
    
    let redacted = text;
    
    redacted = redacted.replace(this.patterns.gstin, '[REDACTED_GSTIN]');
    redacted = redacted.replace(this.patterns.pan, '[REDACTED_PAN]');
    redacted = redacted.replace(this.patterns.aadhaar, '[REDACTED_AADHAAR]');
    redacted = redacted.replace(this.patterns.upi, '[REDACTED_UPI]');
    redacted = redacted.replace(this.patterns.creditCard, '[REDACTED_CARD]');
    
    // For bank accounts, we have to be careful not to redact regular numbers 
    // like amounts or dates. We'll only apply bank account redaction if we find 
    // context keywords like 'A/C', 'Account', 'Acc', etc.
    const accountContextRegex = /(?:a\/c|account|acc|bank)[\s#:-]*([0-9]{9,18})\b/gi;
    redacted = redacted.replace(accountContextRegex, (match, p1) => {
      return match.replace(p1, '[REDACTED_ACCOUNT]');
    });

    return redacted;
  }
}
