import { describe, expect, it } from 'vitest';

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
    expect(result).toContain('Team ParaSpell✨');
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

  it('should escape HTML entities in title and user-provided values', () => {
    const result = generateConfirmationEmailHtml(
      '<h1>Request</h1>',
      '<img src=x onerror=alert(1)>',
      '1000 & "500"',
    );

    expect(result).not.toContain('<h1>');
    expect(result).not.toContain('<img src=x');
    expect(result).toContain('&lt;h1&gt;Request&lt;/h1&gt;');
    expect(result).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(result).toContain('1000 &amp; &quot;500&quot;');
  });
});
