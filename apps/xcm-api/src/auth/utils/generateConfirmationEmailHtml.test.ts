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
    expect(result).toContain('<html');
    expect(result).toContain('</html>');
    expect(result).toContain('<head>');
    expect(result).toContain('</head>');
    expect(result).toContain('<body');
    expect(result).toContain('</body>');
    expect(result).toContain("We've got your request");
    expect(result).toContain('Team ParaSpell&#10024;');
  });

  it('should handle empty strings gracefully', () => {
    const result = generateConfirmationEmailHtml('', '', '');

    expect(result).toContain('<html');
    expect(result).toContain('</html>');
    expect(result).toContain('<head>');
    expect(result).toContain('</head>');
    expect(result).toContain('<body');
    expect(result).toContain('</body>');
    expect(result).toContain("We've got your request");
  });

  it('should escape HTML metacharacters in user-supplied values', () => {
    const injectedLink =
      '</span><a href="https://attacker.example">Review request</a><span>';

    const result = generateConfirmationEmailHtml(
      injectedLink,
      injectedLink,
      injectedLink,
    );

    expect(result).not.toContain('<a href="https://attacker.example">');
    expect(result).toContain(
      '&lt;/span&gt;&lt;a href=&quot;https://attacker.example&quot;&gt;Review request&lt;/a&gt;&lt;span&gt;',
    );
  });
});
