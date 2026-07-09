import { Transform } from 'class-transformer';
import * as xss from 'xss';

/**
 * Decorator that sanitizes HTML input to prevent XSS attacks.
 * It trims the string and removes unsafe HTML tags.
 */
export function SanitizeHtml() {
  return Transform(({ value }) => {
    if (typeof value === 'string') {
      return xss.filterXSS(value.trim());
    }
    return value;
  });
}
