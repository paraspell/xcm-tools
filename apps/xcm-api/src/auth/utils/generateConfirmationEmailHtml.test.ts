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

  it('should encode HTML metacharacters in reason and requestedLimit', () => {
    const injectedLink =
      '</span><a href="https://attacker.example">Review request</a><span>';

    const result = generateConfirmationEmailHtml(
      'Request Submission Confirmation',
      injectedLink,
      '500',
    );

    expect(result).not.toContain('<a href="https://attacker.example">');
    expect(result).toContain('&lt;/span&gt;&lt;a href=&quot;https://attacker.example&quot;&gt;');
    expect(result).toContain('&lt;/a&gt;&lt;span&gt;');
    expect(result).toContain('<html>');
    expect(result).toContain('</html>');
  });
});
