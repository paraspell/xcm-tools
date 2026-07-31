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

  it('should escape HTML in user-controlled fields to prevent injection (#2008)', () => {
    const injectedReason =
      '</span><a href="https://attacker.example">Review request</a><span>';
    const result = generateConfirmationEmailHtml(
      'Title',
      injectedReason,
      '500',
    );

    // The injected anchor tag must NOT appear in the output
    expect(result).not.toContain('<a href="https://attacker.example">');
    expect(result).not.toContain('</a>');
    // The dangerous characters must be escaped
    expect(result).toContain('&lt;/span&gt;');
    expect(result).toContain('&lt;a href=');
  });
});
