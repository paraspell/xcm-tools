import { describe, it, expect } from 'vitest';
import { generateConfirmationEmailHtml } from './generateConfirmationEmailHtml.js';

describe('generateConfirmationEmailHtml', () => {
  it('should generate the correct HTML content', () => {
    const title = 'Confirmation Email';
    const reason = 'Increased API requests';
    const requestedLimit = '100 requests per minute';

    const result = generateConfirmationEmailHtml(title, reason, requestedLimit);

    expect(result).toContain(title);
    expect(result).toContain(reason);
    expect(result).toContain(requestedLimit);
    expect(result).toContain('<html>');
    expect(result).toContain('</html>');
    expect(result).toContain('<head>');
    expect(result).toContain('</head>');
    expect(result).toContain('<body');
    expect(result).toContain('</body>');
    expect(result).toContain('Your request has been submitted successfully.');
    expect(result).toContain('Team LightSpell✨');
  });

  it('should handle empty strings gracefully', () => {
    const result = generateConfirmationEmailHtml('', '', '');

    expect(result).toContain('<html>');
    expect(result).toContain('</html>');
    expect(result).toContain('<head>');
    expect(result).toContain('</head>');
    expect(result).toContain('<body');
    expect(result).toContain('</body>');
    expect(result).toContain('Your request has been submitted successfully.');
  });
});
